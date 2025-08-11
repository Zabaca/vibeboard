import React, { Suspense, useEffect, useRef, useState } from 'react';
import type { ESMExecutionResult } from '../utils/esmExecutor.ts';
import { esmExecutor } from '../utils/esmExecutor.ts';

/**
 * AsyncComponentLoader - Handles async loading of ESM components with proper error boundaries
 * Provides loading states, error handling, and Suspense support for better UX
 */

export interface AsyncComponentLoaderProps {
  code?: string;
  moduleUrl?: string;
  fallback?: React.ReactNode;
  errorFallback?: React.ComponentType<{ error: Error; retry: () => void }>;
  onLoad?: (result: ESMExecutionResult) => void;
  onError?: (error: Error) => void;
  className?: string;
  style?: React.CSSProperties;
  debug?: boolean;
  cache?: boolean;
  presentationMode?: boolean;
}

interface LoaderState {
  status: 'idle' | 'loading' | 'success' | 'error';
  component: React.ComponentType | null;
  error: Error | null;
  metadata?: ESMExecutionResult['metadata'];
}

// Error boundary component for runtime errors
class ComponentErrorBoundary extends React.Component<
  {
    children: React.ReactNode;
    onError?: (error: Error) => void;
    fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
    retry: () => void;
  },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: {
    children: React.ReactNode;
    onError?: (error: Error) => void;
    fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
    retry: () => void;
  }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Component runtime error:', error, errorInfo);
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        const Fallback = this.props.fallback;
        return <Fallback error={this.state.error} retry={this.props.retry} />;
      }

      return (
        <div className="async-component-error">
          <h3>Component Error</h3>
          <p>{this.state.error.message}</p>
          <button onClick={this.props.retry}>Retry</button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Default loading component
const DefaultLoadingComponent: React.FC = () => (
  <div className="async-component-loading">
    <div className="loading-spinner" />
    <p>Loading component...</p>
  </div>
);

// Default error component
const DefaultErrorComponent: React.FC<{ error: Error; retry: () => void }> = ({ error, retry }) => (
  <div className="async-component-error">
    <h3>Failed to load component</h3>
    <p>{error.message}</p>
    <button onClick={retry}>Retry</button>
  </div>
);

export const AsyncComponentLoader: React.FC<AsyncComponentLoaderProps> = ({
  code,
  moduleUrl,
  fallback = <DefaultLoadingComponent />,
  errorFallback = DefaultErrorComponent,
  onLoad,
  onError,
  className = '',
  style = {},
  debug = false,
  cache = true,
  presentationMode = false,
}) => {
  const [state, setState] = useState<LoaderState>({
    status: 'idle',
    component: null,
    error: null,
  });

  const loadAttempts = useRef(0);
  const maxRetries = 3;

  // Load component function
  const loadComponent = async () => {
    // Check if we have either code or moduleUrl
    if (!(code || moduleUrl)) {
      setState({
        status: 'error',
        component: null,
        error: new Error('No code or module URL provided'),
      });
      return;
    }

    setState((prev) => ({ ...prev, status: 'loading', error: null }));
    loadAttempts.current++;

    try {
      let result: ESMExecutionResult;

      if (moduleUrl) {
        // Check if this is a CDN URL that can be imported directly
        const isCDNUrl =
          moduleUrl.startsWith('https://esm.sh/') ||
          moduleUrl.startsWith('https://cdn.jsdelivr.net/') ||
          moduleUrl.startsWith('https://unpkg.com/');

        if (isCDNUrl && moduleUrl.includes('?external=react')) {
          // DIRECT CDN IMPORT - No blob URL needed!
          if (debug) {
            console.log('🚀 Direct CDN import (no blob):', moduleUrl);
          }

          try {
            // Direct ES module import - import maps work normally
            const module = await import(/* @vite-ignore */ moduleUrl);

            // Extract component using enhanced logic
            let component = null;

            if (debug) {
              console.log('🔍 Analyzing CDN module exports:', Object.keys(module));
              console.log('🔍 Module.default type:', typeof module.default);
              console.log('🔍 Module.default:', module.default);
            }

            // 1. Check for default export (most common)
            if (module.default && typeof module.default === 'function') {
              component = module.default;
            }
            // 2. Check for named 'Component' export
            else if (module.Component && typeof module.Component === 'function') {
              component = module.Component;
            }
            // 3. Check for any capitalized function export (React component naming convention)
            else {
              const moduleRecord = module as Record<string, unknown>;
              for (const key in moduleRecord) {
                if (
                  typeof moduleRecord[key] === 'function' &&
                  key !== '__esModule' &&
                  /^[A-Z]/.test(key)
                ) {
                  component = moduleRecord[key] as React.ComponentType;
                  if (debug) {
                    console.log(`🎯 Found component via capitalized export: ${key}`);
                  }
                  break;
                }
              }
            }

            // 4. If still no component, check if default export might be an object with a component
            if (!component && module.default && typeof module.default === 'object') {
              const defaultObj = module.default as Record<string, unknown>;
              for (const key in defaultObj) {
                if (typeof defaultObj[key] === 'function' && /^[A-Z]/.test(key)) {
                  component = defaultObj[key] as React.ComponentType;
                  if (debug) {
                    console.log(`🎯 Found component in default object: ${key}`);
                  }
                  break;
                }
              }
            }

            if (!component) {
              throw new Error('No valid React component found in CDN module');
            }

            result = {
              success: true,
              component,
              moduleUrl,
              metadata: {
                loadTime: 0, // Direct import is essentially instant
                moduleSize: 0, // Unknown for direct imports
              },
            };

            if (debug) {
              console.log('✅ Direct CDN import successful!');
            }
          } catch (directImportError) {
            if (debug) {
              console.log('❌ Direct CDN import failed');
              console.error('Direct import error:', directImportError);
            }
            // For CDN URLs, direct import failure means the URL/component is invalid
            // No need to fall back to blob method for CDN URLs
            throw new Error(
              `Direct CDN import failed: ${directImportError instanceof Error ? directImportError.message : String(directImportError)}`,
            );
          }
        } else {
          // TRADITIONAL FETCH + BLOB METHOD (for local files and non-CDN URLs)
          if (debug) {
            console.log('📦 Loading component via fetch+blob method:', moduleUrl);
          }

          // Fetch the module content
          const response = await fetch(moduleUrl);
          if (!response.ok) {
            throw new Error(`Failed to fetch module: ${response.statusText}`);
          }

          const moduleCode = await response.text();
          if (debug) {
            console.log('📄 Fetched module code:', `${moduleCode.substring(0, 200)}...`);
          }

          // Process through ESM executor to handle React imports properly
          result = await esmExecutor.executeModule(moduleCode, {
            debug,
            cache,
          });

          // Update result with URL metadata
          if (result.success) {
            result.moduleUrl = moduleUrl;
          }
        }
      } else if (code) {
        // Execute ESM code
        result = await esmExecutor.executeModule(code, {
          debug,
          cache,
        });
      } else {
        throw new Error('No code or module URL provided');
      }

      if (result.success && result.component) {
        setState({
          status: 'success',
          component: result.component,
          error: null,
          metadata: result.metadata,
        });

        onLoad?.(result);

        if (debug && result.metadata) {
          console.log(`✅ Component loaded in ${result.metadata.loadTime.toFixed(2)}ms`);
        }
      } else {
        throw new Error(result.error || 'Failed to load component');
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));

      if (debug) {
        console.error('❌ Component loading failed:', err);
      }

      setState({
        status: 'error',
        component: null,
        error: err,
      });

      onError?.(err);

      // Auto-retry with exponential backoff
      if (loadAttempts.current < maxRetries) {
        const delay = 2 ** loadAttempts.current * 1000;
        if (debug) {
          console.log(`🔄 Retrying in ${delay}ms (attempt ${loadAttempts.current}/${maxRetries})`);
        }
        setTimeout(loadComponent, delay);
      }
    }
  };

  // Effect to load component when code or moduleUrl changes
  useEffect(() => {
    if (code || moduleUrl) {
      loadAttempts.current = 0;
      loadComponent();
    }
  }, [code, moduleUrl, loadComponent]);

  // Retry function
  const retry = () => {
    loadAttempts.current = 0;
    loadComponent();
  };

  // Render based on state
  const renderContent = () => {
    switch (state.status) {
      case 'idle':
      case 'loading':
        return fallback;

      case 'error':
        if (state.error) {
          const ErrorComponent = errorFallback;
          return <ErrorComponent error={state.error} retry={retry} />;
        }
        return null;

      case 'success':
        if (state.component) {
          const Component = state.component;
          return (
            <ComponentErrorBoundary onError={onError} fallback={errorFallback} retry={retry}>
              <Suspense fallback={fallback}>
                <Component />
              </Suspense>
            </ComponentErrorBoundary>
          );
        }
        return null;

      default:
        return null;
    }
  };

  // Container classes
  const containerClass = [
    'async-component-loader',
    className,
    `status-${state.status}`,
    presentationMode ? 'presentation-mode' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={containerClass} style={style}>
      {renderContent()}

      {/* Debug info */}
      {debug && state.metadata && (
        <div className="debug-info">
          <small>
            Load time: {state.metadata.loadTime.toFixed(2)}ms | Size:{' '}
            {(state.metadata.moduleSize / 1024).toFixed(2)}KB
            {state.metadata.dependencies && ` | Deps: ${state.metadata.dependencies.length}`}
          </small>
        </div>
      )}
    </div>
  );
};

// Lazy loading wrapper for components
export const LazyComponent: React.FC<{
  importFn: () => Promise<{ default: React.ComponentType }>;
  fallback?: React.ReactNode;
}> = ({ importFn, fallback = <DefaultLoadingComponent /> }) => {
  const Component = React.lazy(importFn);

  return (
    <Suspense fallback={fallback}>
      <Component />
    </Suspense>
  );
};

// Hook for async component loading
export function useAsyncComponent(
  code?: string,
  options: {
    debug?: boolean;
    cache?: boolean;
    autoLoad?: boolean;
  } = {},
) {
  const [state, setState] = useState<LoaderState>({
    status: 'idle',
    component: null,
    error: null,
  });

  const load = async () => {
    if (!code) {
      setState({
        status: 'error',
        component: null,
        error: new Error('No code provided'),
      });
      return;
    }

    setState((prev) => ({ ...prev, status: 'loading', error: null }));

    try {
      const result = await esmExecutor.executeModule(code, {
        debug: options.debug,
        cache: options.cache,
      });

      if (result.success && result.component) {
        setState({
          status: 'success',
          component: result.component,
          error: null,
          metadata: result.metadata,
        });
      } else {
        throw new Error(result.error || 'Failed to load component');
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      setState({
        status: 'error',
        component: null,
        error: err,
      });
    }
  };

  useEffect(() => {
    if (options.autoLoad && code) {
      load();
    }
  }, [code, options.autoLoad, load]);

  return {
    ...state,
    load,
    retry: load,
  };
}

// Add styles for the loader
const styles = `
.async-component-loader {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 100px;
}

.async-component-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  color: #666;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.async-component-error {
  padding: 20px;
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 4px;
  color: #c00;
}

.async-component-error h3 {
  margin-top: 0;
  color: #900;
}

.async-component-error button {
  padding: 8px 16px;
  background: #c00;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
}

.async-component-error button:hover {
  background: #900;
}

.debug-info {
  position: absolute;
  bottom: 0;
  right: 0;
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.8);
  color: #0f0;
  font-family: monospace;
  font-size: 10px;
  border-radius: 4px 0 0 0;
  pointer-events: none;
}

.presentation-mode .debug-info {
  display: none;
}
`;

// Inject styles if not already present
if (typeof document !== 'undefined' && !document.querySelector('#async-component-loader-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'async-component-loader-styles';
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}
