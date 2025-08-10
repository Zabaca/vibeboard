import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ComponentPipeline } from '../services/ComponentPipeline.ts';
import type { UnifiedComponentNode } from '../types/component.types.ts';

interface GeneratedAppProps {
  code?: string;
  component?: UnifiedComponentNode;
  presentationMode?: boolean;
  onCompilationComplete?: (compiledCode: string, hash: string) => void;
}

interface ErrorInfo {
  message: string;
  stack?: string;
  code?: string;
  line?: number;
  column?: number;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: ErrorInfo | null;
}

// Enhanced Error boundary component with detailed error info
class ErrorBoundary extends React.Component<
  { 
    children: React.ReactNode; 
    code: string;
    onError?: (error: ErrorInfo) => void;
  },
  ErrorBoundaryState
> {
  constructor(props: {
    children: React.ReactNode;
    code: string;
    onError?: (error: ErrorInfo) => void;
  }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Parse the error to extract useful information
    const errorInfo: ErrorInfo = {
      message: error.message,
      stack: error.stack,
    };

    // Try to extract line/column from stack trace
    const stackLines = error.stack?.split('\n') || [];
    const relevantLine = stackLines.find(line => 
      line.includes('eval') || line.includes('Function')
    );
    
    if (relevantLine) {
      const match = relevantLine.match(/:(\d+):(\d+)/);
      if (match) {
        errorInfo.line = parseInt(match[1], 10);
        errorInfo.column = parseInt(match[2], 10);
      }
    }

    return { hasError: true, error: errorInfo };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Component error details:', {
      error: error.message,
      componentStack: errorInfo.componentStack,
      errorBoundary: 'GeneratedApp',
    });
    
    if (this.props.onError && this.state.error) {
      this.props.onError(this.state.error);
    }
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const handleCopy = () => {
        const errorReport = `Runtime Error:
${this.state.error?.message}
${this.state.error?.line ? `Line ${this.state.error.line}, Column ${this.state.error.column}` : ''}

Stack Trace:
${this.state.error?.stack || 'No stack trace available'}

Code:
${this.props.code}`;

        navigator.clipboard.writeText(errorReport).then(() => {
          // Show feedback - could be enhanced with a toast notification
          console.log('Error report copied to clipboard');
        });
      };

      return (
        <div
          style={{
            padding: '12px',
            color: '#dc2626',
            backgroundColor: '#fee2e2',
            borderRadius: '8px',
            fontSize: '12px',
            fontFamily: 'monospace',
            maxHeight: '100%',
            overflow: 'auto',
          }}
        >
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '8px' 
          }}>
            <div style={{ fontWeight: 'bold' }}>
              🚨 Runtime Error
            </div>
            <button
              onClick={handleCopy}
              style={{
                padding: '4px 8px',
                backgroundColor: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
              title="Copy error and code to clipboard"
            >
              📋 Copy
            </button>
          </div>
          <div style={{ marginBottom: '8px' }}>
            {this.state.error.message}
          </div>
          {this.state.error.line && (
            <div style={{ fontSize: '11px', color: '#991b1b' }}>
              Line {this.state.error.line}, Column {this.state.error.column}
            </div>
          )}
          <details style={{ marginTop: '8px' }}>
            <summary style={{ cursor: 'pointer', userSelect: 'none' }}>
              View Code
            </summary>
            <pre style={{ 
              fontSize: '10px', 
              overflow: 'auto',
              maxHeight: '150px',
              padding: '8px',
              backgroundColor: 'white',
              borderRadius: '4px',
              marginTop: '4px',
            }}>
              {this.props.code}
            </pre>
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}

const GeneratedApp = ({ code, component, presentationMode = false, onCompilationComplete }: GeneratedAppProps) => {
  const [Component, setComponent] = useState<React.ComponentType | null>(null);
  const [error, setError] = useState<ErrorInfo | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const pipelineRef = useRef<ComponentPipeline | null>(null);
  
  // Get or create pipeline instance
  if (!pipelineRef.current) {
    pipelineRef.current = new ComponentPipeline();
  }

  // Lazy transpilation: track if component has been rendered yet
  const [hasBeenRendered, setHasBeenRendered] = useState(false);
  const [isInViewport, setIsInViewport] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer to detect when component enters viewport (lazy rendering)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !hasBeenRendered) {
          console.log('🔍 Component entered viewport, starting lazy transpilation...');
          setIsInViewport(true);
          setHasBeenRendered(true);
        }
      },
      {
        rootMargin: '50px', // Start loading 50px before component is visible
        threshold: 0.1, // Trigger when 10% of component is visible
      }
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [hasBeenRendered]);

  // Memoize the code hash to prevent re-processing when the same code is used
  const codeHash = useMemo(() => {
    const codeToHash = component?.originalCode || code || '';
    let hash = 0;
    for (let i = 0; i < codeToHash.length; i++) {
      const char = codeToHash.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }, [component?.originalCode, code]);

  // Track if component has already been processed for this hash
  const [processedHash, setProcessedHash] = useState<string | null>(null);

  // Fallback for intersection observer - process stored components after a delay
  useEffect(() => {
    const hasStoredCode = component?.compiledAt && (component?.originalCode || component?.compiledCode);
    
    if (hasStoredCode && !isInViewport && !hasBeenRendered) {
      console.log('📦 Stored component detected, setting fallback timer');
      const fallbackTimer = setTimeout(() => {
        console.log('🔄 Intersection observer fallback - forcing stored component to render');
        setIsInViewport(true);
      }, 500); // Short delay to let intersection observer work first
      
      return () => clearTimeout(fallbackTimer);
    }
  }, [component?.compiledAt, component?.originalCode, component?.compiledCode, isInViewport, hasBeenRendered]);

  useEffect(() => {
    // Only process component if it has been rendered (lazy transpilation) or is in viewport
    if (!isInViewport && !hasBeenRendered) {
      return;
    }

    // Skip if already processed this exact code
    if (processedHash === codeHash) {
      return;
    }

    const processComponent = async () => {
      try {
        // Reset state
        setError(null);
        setComponent(null);
        setIsProcessing(true);

        // Determine what code to use
        let codeToUse: string | undefined;
        let needsCompilation = false;
        
        if (component) {
          // If we have a UnifiedComponentNode, check for compiled code first
          if (component.compiledCode) {
            codeToUse = component.compiledCode;
          } else if (component.originalCode) {
            codeToUse = component.originalCode;
            needsCompilation = true;
          }
        } else if (code) {
          // Fallback to raw code for backward compatibility
          codeToUse = code;
          needsCompilation = true;
        }
        
        if (!codeToUse || codeToUse.trim() === '') {
          setError({ message: 'No code provided' });
          setIsProcessing(false);
          return;
        }

        let transpiledCode: string;
        let pipelineComponent: UnifiedComponentNode | undefined;
        
        // If we need compilation, use the pipeline (lazy transpilation)
        if (needsCompilation && pipelineRef.current) {
          const pipelineResult = await pipelineRef.current.processComponent(
            component || { originalCode: codeToUse },
            {
              useCache: true,
              validateOutput: true,
              debug: false, // Disable debug mode to reduce CPU usage
            }
          );
          
          if (!pipelineResult.success) {
            setError({
              message: pipelineResult.error || 'Pipeline processing failed',
              code: codeToUse
            });
            setIsProcessing(false);
            return;
          }
          
          pipelineComponent = pipelineResult.component!;
          transpiledCode = pipelineComponent.compiledCode!;
          
          // Notify parent of compilation completion (lazy compilation cache update)
          if (onCompilationComplete && pipelineComponent.compiledHash) {
            onCompilationComplete(transpiledCode, pipelineComponent.compiledHash);
          }
        } else {
          // Use pre-compiled code directly
          transpiledCode = codeToUse;
        }

        // ESM-ONLY EXECUTION: All components are processed as ESM modules
        try {
          const { esmExecutor } = await import('../utils/esmExecutor.ts');
          console.log('🚀 ESM-only execution for component');
          
          const esmResult = await esmExecutor.executeModule(transpiledCode, {
            debug: false,
            cache: true,
          });

          if (esmResult.success && esmResult.component) {
            setComponent(() => esmResult.component as React.ComponentType<Record<string, never>> | null)
            setProcessedHash(codeHash); // Mark this code as processed
          } else {
            const errorInfo: ErrorInfo = {
              message: esmResult.error || 'Failed to execute ESM component',
              code: transpiledCode,
            };
            setError(errorInfo);
          }
        } catch (esmError) {
          const errorInfo: ErrorInfo = {
            message: esmError instanceof Error ? esmError.message : 'ESM execution error',
            code: transpiledCode,
          };
          setError(errorInfo);
        }
      } catch (err: unknown) {
        const errorInfo: ErrorInfo = {
          message: err instanceof Error ? err.message : 'Unknown error',
          stack: err instanceof Error ? err.stack : undefined,
          code: code || component?.originalCode,
        };
        setError(errorInfo);
      } finally {
        setIsProcessing(false);
      }
    };

    processComponent();
  }, [codeHash, isInViewport, hasBeenRendered, processedHash, component, code, onCompilationComplete]);

  // Compilation/transpilation error display
  if (error) {
    const handleCopyError = () => {
      const errorReport = `Compilation Error:
${error.message}
${error.line ? `Line ${error.line}, Column ${error.column}` : ''}

Stack Trace:
${error.stack || 'No stack trace available'}

Code:
${code || component?.originalCode || ''}`;

      navigator.clipboard.writeText(errorReport).then(() => {
        console.log('Error report copied to clipboard');
      });
    };

    return (
      <div
        style={{
          padding: '12px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#fef2f2',
          borderRadius: '8px',
          overflow: 'auto',
        }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px',
        }}>
          <div style={{
            color: '#dc2626',
            fontWeight: 'bold',
            fontSize: '13px',
          }}>
            ⚠️ Compilation Error
          </div>
          <button
            onClick={handleCopyError}
            style={{
              padding: '4px 8px',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '11px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
            title="Copy error and code to clipboard"
          >
            📋 Copy
          </button>
        </div>
        <div style={{
          color: '#991b1b',
          fontSize: '12px',
          fontFamily: 'monospace',
          marginBottom: '8px',
        }}>
          {error.message}
        </div>
        {error.line && (
          <div style={{ fontSize: '11px', color: '#7f1d1d' }}>
            Line {error.line}, Column {error.column}
          </div>
        )}
        <button
          onClick={() => setShowDebug(!showDebug)}
          style={{
            marginTop: '8px',
            padding: '4px 8px',
            backgroundColor: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '11px',
            cursor: 'pointer',
            alignSelf: 'flex-start',
          }}
        >
          {showDebug ? 'Hide' : 'Show'} Debug Info
        </button>
        {showDebug && (
          <pre style={{
            marginTop: '8px',
            padding: '8px',
            backgroundColor: 'white',
            borderRadius: '4px',
            fontSize: '10px',
            overflow: 'auto',
            flexGrow: 1,
            border: '1px solid #fecaca',
          }}>
            {code || component?.originalCode || ''}
          </pre>
        )}
      </div>
    );
  }

  if (!Component) {
    return (
      <div
        ref={containerRef}
        style={{
          padding: '20px',
          textAlign: 'center',
          color: '#6b7280',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
        }}
      >
        <div style={{
          animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          marginBottom: '12px',
        }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{ color: '#6366f1' }}>
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div style={{ fontSize: '14px', fontWeight: '500' }}>
          {!hasBeenRendered && !isInViewport ? 'Component ready...' : 
           isProcessing ? 'Processing component...' : 'Initializing component...'}
        </div>
        <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.7 }}>
          {!hasBeenRendered && !isInViewport ? 'Will transpile when visible (lazy loading)' :
           component?.compiledCode ? 'Loading pre-compiled component' : 
           'Transpiling JSX to JavaScript'}
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary 
      code={code || component?.originalCode || ''}
      onError={(error) => {
        console.error('Runtime error in generated component:', error);
      }}
    >
      <div 
        ref={containerRef}
        style={{ 
          width: '100%', 
          height: '100%', 
          backgroundColor: presentationMode ? 'transparent' : 'white',
          position: 'relative',
          overflow: 'auto',
        }}
      >
        <Component />
      </div>
    </ErrorBoundary>
  );
};

// Memoize the component to prevent re-renders unless props actually change
export default React.memo(GeneratedApp, (prevProps, nextProps) => {
  // Only re-render if any of these props actually changed
  return prevProps.code === nextProps.code && 
         prevProps.presentationMode === nextProps.presentationMode &&
         prevProps.component?.originalCode === nextProps.component?.originalCode &&
         prevProps.component?.compiledCode === nextProps.component?.compiledCode &&
         prevProps.component?.compiledHash === nextProps.component?.compiledHash;
});