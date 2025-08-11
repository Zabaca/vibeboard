import React, { useCallback, useMemo, useRef } from 'react';
import { Handle, type NodeProps, NodeResizer, Position } from '@xyflow/react';
import type { UnifiedComponentNode } from '../types/component.types.ts';
import {
  captureAndCopyToClipboard,
  getOptimalScreenshotOptions,
  type ScreenshotResult,
} from '../utils/screenshotUtils.ts';
import { AsyncComponentLoader } from './AsyncComponentLoader.tsx';
import GeneratedApp from './GeneratedApp.tsx';
import ShapeNode from './native/ShapeNode.tsx';
import TextNode from './native/TextNode.tsx';
import StickyNote from './native/StickyNote.tsx';

interface ComponentNodeData extends UnifiedComponentNode {
  // Legacy fields for backward compatibility
  code?: string; // Will be mapped to originalCode
  prompt?: string; // Will be mapped to metadata.prompt
  generationTime?: number; // Will be mapped to metadata.generationTime

  // Native component fields (for compatibility with native components)
  componentType?: 'native' | 'ai';
  nativeType?: import('../types/native-component.types.ts').NativeComponentType;
  state?: import('../types/native-component.types.ts').ComponentState;

  // UI-specific fields
  presentationMode?: boolean;
  onDelete?: (appId: string) => void;
  onRegenerate?: (appId: string, prompt: string, currentCode?: string) => void;
  onDuplicate?: (nodeData: ComponentNodeData) => void;
  onCompilationComplete?: (nodeId: string, compiledCode: string, hash: string) => void;
  onCaptureScreenshot?: (nodeId: string, screenshotResult: ScreenshotResult) => void;
  onUpdateState?: (nodeId: string, newState: import('../types/native-component.types.ts').ComponentState) => void;

  // Index signature for React Flow compatibility
  [key: string]: unknown;
}

type ComponentNodeProps = NodeProps;

const ComponentNodeImpl = ({ id, data, selected = false }: ComponentNodeProps) => {
  // console.log('🔧 [DEBUG] ComponentNode render:', { id, selected, timestamp: Date.now() });
  
  const nodeData = data as ComponentNodeData;
  
  // Refs for screenshot capture functionality
  const componentRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Simple render without complex logic for testing
  if (!nodeData) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        padding: '20px',
        border: '2px solid #ccc',
        borderRadius: '8px',
        backgroundColor: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        No data
      </div>
    );
  }

  // Render native components using proper native component renderers
  if (nodeData.componentType === 'native') {
    const nativeProps = {
      id,
      data: nodeData,
      selected,
    };

    switch (nodeData.nativeType) {
      case 'shape':
        return <ShapeNode key={id} {...nativeProps} />;
      case 'text':
        return <TextNode key={id} {...nativeProps} />;
      case 'sticky':
        return <StickyNote key={id} {...nativeProps} />;
      default:
        return (
          <div style={{
            width: '100%',
            height: '100%',
            padding: '20px',
            border: selected ? '3px solid #6366f1' : '2px solid #ccc',
            borderRadius: '8px',
            backgroundColor: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'move'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '18px', marginBottom: '8px' }}>❓</div>
              <div style={{ fontSize: '14px', color: '#666' }}>Unknown native type: {nodeData.nativeType}</div>
            </div>
          </div>
        );
    }
  }

  // For AI components, we need the complex logic
  const code = nodeData.code || nodeData.compiledCode || nodeData.originalCode;
  const prompt = nodeData.prompt || nodeData.metadata?.prompt || nodeData.description;
  const generationTime = nodeData.generationTime || nodeData.metadata?.generationTime;
  const {
    presentationMode,
    onDelete,
    onRegenerate,
    onDuplicate,
    onCompilationComplete,
    onCaptureScreenshot,
  } = nodeData;

  // Create a UnifiedComponentNode from the data (moved before screenshot callback)
  const unifiedComponent = useMemo(() => {
    // Early check for data
    if (!nodeData) {
      return {
        id,
        originalCode: '',
        source: 'ai-generated',
        description: '',
        metadata: {},
      } as UnifiedComponentNode;
    }

    // Map legacy fields to the unified structure
    const component: UnifiedComponentNode = {
      id: nodeData.id || id,
      originalCode: nodeData.originalCode || nodeData.code || '',
      compiledCode: nodeData.compiledCode,
      sourceUrl: nodeData.sourceUrl, // ✨ CRITICAL: Copy sourceUrl from nodeData
      originalHash: nodeData.originalHash,
      compiledHash: nodeData.compiledHash,
      compiledAt: nodeData.compiledAt,
      source: nodeData.source || 'ai-generated',
      format: nodeData.format,
      compilerVersion: nodeData.compilerVersion,
      description: nodeData.description || prompt,
      metadata: nodeData.metadata || {
        prompt,
        generationTime,
      },
    };
    return component;
  }, [nodeData, id, prompt, generationTime]);

  // Screenshot capture functionality (now after unifiedComponent is defined)
  const captureScreenshot = useCallback(
    async (
      scenario: 'component' | 'preview' | 'thumbnail' = 'component',
    ): Promise<ScreenshotResult | null> => {
      // Try different capture strategies
      let elementToCapture = null;
      let captureStrategy = '';

      // Strategy 1: Try to capture just the rendered component content
      if (contentRef.current && contentRef.current.children.length > 0) {
        elementToCapture = contentRef.current;
        captureStrategy = 'content area only';
        console.log('📋 Using content area capture strategy');
      }
      // Strategy 2: Try to find the actual component inside contentRef
      else if (contentRef.current) {
        const componentDiv = contentRef.current.querySelector('div[style], div[class]');
        if (componentDiv && componentDiv instanceof HTMLElement) {
          elementToCapture = componentDiv;
          captureStrategy = 'inner component div';
          console.log('🎯 Found inner component div in content area');
        }
      }
      // Strategy 3: Fallback to full component
      if (!elementToCapture) {
        elementToCapture = componentRef.current;
        captureStrategy = 'full component fallback';
        console.log('⚠️ Using fallback: full component');
      }

      if (!elementToCapture) {
        console.warn('ComponentNode: No component element available for screenshot');
        return {
          success: false,
          error: 'Component element not found',
          capturedAt: Date.now(),
        };
      }

      // Debug: log what we're about to capture
      console.log('🎯 Capturing screenshot of:', {
        captureStrategy,
        elementSize: `${elementToCapture.offsetWidth}x${elementToCapture.offsetHeight}`,
        elementPosition: {
          top: elementToCapture.offsetTop,
          left: elementToCapture.offsetLeft,
        },
        hasChildren: elementToCapture.children.length,
        innerHTML:
          elementToCapture.innerHTML.length > 200
            ? `${elementToCapture.innerHTML.substring(0, 200)}...`
            : elementToCapture.innerHTML,
        childrenInfo: Array.from(elementToCapture.children).map((child) => ({
          tagName: child.tagName,
          className: child.className,
          textContent: `${child.textContent?.substring(0, 30)}...`,
          offsetSize: `${(child as HTMLElement).offsetWidth}x${(child as HTMLElement).offsetHeight}`,
        })),
        computedStyle: {
          display: getComputedStyle(elementToCapture).display,
          visibility: getComputedStyle(elementToCapture).visibility,
          overflow: getComputedStyle(elementToCapture).overflow,
          backgroundColor: getComputedStyle(elementToCapture).backgroundColor,
          transform: getComputedStyle(elementToCapture).transform,
        },
        textContent: `${elementToCapture.textContent?.substring(0, 100)}...`,
      });

      // Also inspect the DOM tree structure
      console.log('🔍 DOM structure:', {
        componentRef: componentRef.current?.tagName,
        componentRefChildren: componentRef.current
          ? Array.from(componentRef.current.children).map((c) => `${c.tagName}.${c.className}`)
          : [],
        contentRef: contentRef.current?.tagName,
        contentRefChildren: contentRef.current
          ? Array.from(contentRef.current.children).map((c) => `${c.tagName}.${c.className}`)
          : [],
      });

      // Handle edge case: component is not ready/loaded
      if (!(code || unifiedComponent.compiledCode || unifiedComponent.originalCode)) {
        console.warn('ComponentNode: No component code available for screenshot');
        return {
          success: false,
          error: 'Component has no code to capture',
          capturedAt: Date.now(),
        };
      }

      // Handle edge case: component is in loading state
      const isLoading =
        elementToCapture.querySelector('[data-loading="true"]') ||
        elementToCapture.textContent?.includes('Loading') ||
        elementToCapture.textContent?.includes('No component generated yet');

      if (isLoading && scenario !== 'thumbnail') {
        console.warn('ComponentNode: Component is in loading state, capturing anyway');
      }

      try {
        // Wait a bit for any CSS animations/transitions to complete
        await new Promise((resolve) => setTimeout(resolve, 100));

        const options = getOptimalScreenshotOptions(scenario);

        // For loading/error states, use smaller dimensions
        if (isLoading) {
          options.maxWidth = 400;
          options.maxHeight = 300;
          options.quality = 0.7;
        }

        const result = await captureAndCopyToClipboard(elementToCapture, {
          ...options,
          debug: true, // Enable debugging to see what's happening
          // Use white background for better contrast with loading states
          backgroundColor: isLoading ? '#f9fafb' : '#ffffff',
          // dom-to-image specific options
          useCORS: true,
          scale: 1, // Ensure 1:1 scale
        });

        // Add metadata about capture context
        if (result.success) {
          const captureMetadata = {
            componentId: id,
            scenario,
            hasCode: !!code,
            isLoading,
            presentationMode: !!presentationMode,
            capturedElement: 'full',
          };

          console.log('📸 Screenshot captured:', captureMetadata);

          if (onCaptureScreenshot) {
            onCaptureScreenshot(id, {
              ...result,
              // Add context metadata (not part of ScreenshotResult interface but can be extended)
            });
          }
        } else {
          console.error('❌ Screenshot capture failed:', result.error);
        }

        return result;
      } catch (error) {
        console.error('ComponentNode screenshot capture failed:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Screenshot capture failed',
          capturedAt: Date.now(),
        };
      }
    },
    [id, onCaptureScreenshot, code, unifiedComponent, presentationMode],
  );

  // Expose screenshot capture method to parent components
  const captureComponentScreenshot = useCallback(
    () => captureScreenshot('component'),
    [captureScreenshot],
  );

  // Memoize the GeneratedApp component to prevent re-renders unless data changes
  const generatedAppComponent = useMemo(() => {
    // Check if this is a URL-imported ES module
    const isUrlImport =
      unifiedComponent.source === 'url-import' &&
      unifiedComponent.sourceUrl &&
      (unifiedComponent.format === 'esm' || unifiedComponent.sourceUrl.endsWith('.js'));

    // 🐛 DEBUG: Let's see what's happening with URL imports
    if (unifiedComponent.source === 'url-import') {
      console.log('🔍 ComponentNode: URL import detected!');
      console.log('  - source:', unifiedComponent.source);
      console.log('  - sourceUrl:', unifiedComponent.sourceUrl);
      console.log('  - format:', unifiedComponent.format);
      console.log('  - isUrlImport:', isUrlImport);
      console.log('  - nodeData.sourceUrl:', nodeData.sourceUrl);
      console.log('  - Full nodeData:', nodeData);
    }

    if (isUrlImport && unifiedComponent.sourceUrl) {
      // Use AsyncComponentLoader for URL-imported ES modules
      // This properly handles dynamic imports without compilation
      return (
        <AsyncComponentLoader
          moduleUrl={unifiedComponent.sourceUrl}
          presentationMode={presentationMode}
          debug={false}
          cache={true}
          fallback={<div style={{ padding: '20px', textAlign: 'center' }}>Loading module...</div>}
          onError={(error) => console.error('Module load error:', error)}
        />
      );
    }

    // Use GeneratedApp for AI-generated code that needs compilation
    if (!(code || unifiedComponent.compiledCode)) {
      return null;
    }
    return (
      <GeneratedApp
        key={`generated-app-${id}`}
        component={unifiedComponent}
        presentationMode={presentationMode}
        onCompilationComplete={
          onCompilationComplete
            ? (compiledCode, hash) => onCompilationComplete(id, compiledCode, hash)
            : undefined
        }
      />
    );
  }, [unifiedComponent, code, presentationMode, onCompilationComplete, id, nodeData]);

  // Render function to avoid conditional early returns
  const renderContent = () => {
    // console.log('🔧 [DEBUG] ComponentNode renderContent called:', { 
    //   id, 
    //   presentationMode, 
    //   hasGeneratedApp: !!generatedAppComponent,
    //   nodeDataKeys: Object.keys(nodeData || {})
    // });
    
    // In presentation mode, show only the component
    if (presentationMode) {
      return (
        <div
          ref={componentRef}
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: 'transparent',
            position: 'relative',
          }}
        >
          {generatedAppComponent ? (
            <div
              data-component-content="true"
              style={{
                width: '100%',
                height: '100%',
                // Override the white background in GeneratedApp
                backgroundColor: 'transparent',
              }}
            >
              {generatedAppComponent}
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: '#9ca3af',
                backgroundColor: 'rgba(255, 255, 255, 0.5)',
                borderRadius: '8px',
                padding: '20px',
              }}
            >
              No component generated yet
            </div>
          )}
        </div>
      );
    }

    // Normal mode with full chrome
    return (
      <div
        ref={componentRef}
        style={{
          width: '100%',
          height: '100%',
          minWidth: '200px',
          minHeight: '150px',
          borderRadius: '12px',
          backgroundColor: 'white',
          boxShadow: selected
            ? '0 8px 32px rgba(99, 102, 241, 0.3), 0 0 0 2px #6366f1'
            : '0 4px 12px rgba(0,0,0,0.08)',
          border: '2px solid #6366f1',
          display: 'flex',
          flexDirection: 'column',
          transition: 'box-shadow 0.2s ease, transform 0.2s ease',
          position: 'relative',
        }}
      >
        {/* Node Resizer - allows users to resize the component */}
        <NodeResizer
          minWidth={100}
          minHeight={100}
          isVisible={selected}
          handleStyle={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: '#6366f1',
            border: '2px solid white',
          }}
          lineStyle={{
            stroke: '#6366f1',
            strokeWidth: 2,
            strokeDasharray: '5 5',
          }}
        />

        {/* Modern Header with node info and controls - DRAGGABLE AREA */}
        <div
          style={{
            padding: '10px 12px',
            borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            fontSize: '11px',
            color: '#1f2937',
            borderTopLeftRadius: '10px',
            borderTopRightRadius: '10px',
            cursor: 'move',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            userSelect: 'none',
            position: 'relative',
          }}
          title="Drag to move component"
        >
          {/* Drag indicator dots */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '4px',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: '2px',
            }}
          >
            <div
              style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#d1d5db' }}
            />
            <div
              style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#d1d5db' }}
            />
            <div
              style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#d1d5db' }}
            />
          </div>

          <div
            style={{
              flex: 1,
              minWidth: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '6px',
            }}
          >
            {/* Modern status indicator */}
            <div
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: code ? '#10b981' : '#fbbf24',
                boxShadow: code
                  ? '0 0 8px rgba(16, 185, 129, 0.4)'
                  : '0 0 8px rgba(251, 191, 36, 0.4)',
                animation: code ? 'none' : 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
              }}
            />

            {/* Title and meta info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontWeight: '600',
                  fontSize: '12px',
                  color: '#111827',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {prompt ? prompt.substring(0, 30) : 'AI Component'}
                {prompt && prompt.length > 30 ? '...' : ''}
              </div>
              {generationTime && (
                <div
                  style={{
                    fontSize: '10px',
                    color: '#9ca3af',
                    marginTop: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 6v6l4 2" />
                    </svg>
                    {generationTime.toFixed(2)}s
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Modern action buttons */}
          <div
            className="nodrag"
            style={{
              display: 'flex',
              gap: '2px',
              marginLeft: '8px',
              marginTop: '6px',
            }}
          >
            {/* Screenshot capture button */}
            <button
              className="nodrag"
              onClick={(e) => {
                e.stopPropagation();
                captureComponentScreenshot();
              }}
              style={{
                background: 'transparent',
                color: '#6b7280',
                border: 'none',
                borderRadius: '6px',
                padding: '6px',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '28px',
                height: '28px',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)';
                e.currentTarget.style.color = '#10b981';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#6b7280';
              }}
              title="Capture Screenshot"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </button>
            {onRegenerate && (
              <button
                className="nodrag"
                onClick={(e) => {
                  e.stopPropagation();
                  onRegenerate(id, prompt || '', code || nodeData.originalCode);
                }}
                style={{
                  background: 'transparent',
                  color: '#6b7280',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '28px',
                  height: '28px',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
                  e.currentTarget.style.color = '#6366f1';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#6b7280';
                }}
                title="Edit"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
            )}
            {onDuplicate && (
              <button
                className="nodrag"
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate(nodeData);
                }}
                style={{
                  background: 'transparent',
                  color: '#6b7280',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '28px',
                  height: '28px',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                  e.currentTarget.style.color = '#3b82f6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#6b7280';
                }}
                title="Duplicate"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="8" y="8" width="16" height="16" rx="2" ry="2" />
                  <rect x="0" y="0" width="16" height="16" rx="2" ry="2" />
                </svg>
              </button>
            )}
            {onDelete && (
              <button
                className="nodrag"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(id);
                }}
                style={{
                  background: 'transparent',
                  color: '#6b7280',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '28px',
                  height: '28px',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                  e.currentTarget.style.color = '#ef4444';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#6b7280';
                }}
                title="Delete"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M3 6h18" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                  <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* AI Component Content */}
        <div
          ref={contentRef} // Ref for screenshot capture
          data-component-content="true"
          className="nodrag" // Prevent dragging when interacting with AI component
          style={{
            flex: 1,
            overflow: 'auto',
            padding: '10px',
            borderBottomLeftRadius: '10px',
            borderBottomRightRadius: '10px',
          }}
        >
          {generatedAppComponent || (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: '#9ca3af',
              }}
            >
              No component generated yet
            </div>
          )}
        </div>

        {/* Connection handles (optional - for future connecting AI components) */}
        <Handle
          type="target"
          position={Position.Top}
          style={{
            width: '8px',
            height: '8px',
            background: '#6366f1',
            border: '2px solid white',
            visibility: selected ? 'visible' : 'hidden',
          }}
        />
        <Handle
          type="source"
          position={Position.Bottom}
          style={{
            width: '8px',
            height: '8px',
            background: '#6366f1',
            border: '2px solid white',
            visibility: selected ? 'visible' : 'hidden',
          }}
        />
      </div>
    );
  };

  // For AI components, fall back to the complex render
  // console.log('🔧 [DEBUG] ComponentNode returning complex render for id:', id);  
  return renderContent();
};

// Create memoized version with custom comparison
const ComponentNode = React.memo(ComponentNodeImpl, (prevProps, nextProps) => {
  // Custom comparison function to prevent unnecessary re-renders
  if (prevProps.id !== nextProps.id || prevProps.selected !== nextProps.selected) {
    return false;
  }
  
  // Deep comparison of data object properties that matter for rendering
  const prevData = prevProps.data as ComponentNodeData;
  const nextData = nextProps.data as ComponentNodeData;
  
  if (!prevData && !nextData) return true;
  if (!prevData || !nextData) return false;
  
  // Compare the key fields that affect rendering
  const prevCode = prevData.code || prevData.compiledCode || prevData.originalCode;
  const nextCode = nextData.code || nextData.compiledCode || nextData.originalCode;
  const prevPrompt = prevData.prompt || prevData.metadata?.prompt || prevData.description;
  const nextPrompt = nextData.prompt || nextData.metadata?.prompt || nextData.description;
  
  return (
    prevCode === nextCode &&
    prevPrompt === nextPrompt &&
    prevData.presentationMode === nextData.presentationMode &&
    prevData.componentType === nextData.componentType &&
    prevData.nativeType === nextData.nativeType &&
    // For native components, also compare the state object
    (prevData.componentType !== 'native' || 
     JSON.stringify(prevData.state) === JSON.stringify(nextData.state))
  );
});

export default ComponentNode;

// TODO: Re-enable memo after fixing rendering issue
// export default memo(ComponentNode, (prevProps, nextProps) => {
//   // Check if data exists
//   if (!prevProps.data && !nextProps.data) return true;
//   if (!prevProps.data || !nextProps.data) return false;
//
//   const prevData = prevProps.data as unknown as ComponentNodeData;
//   const nextData = nextProps.data as unknown as ComponentNodeData;
//
//   // Check both legacy and new fields for changes
//   const prevCode = prevData.code || prevData.compiledCode || prevData.originalCode;
//   const nextCode = nextData.code || nextData.compiledCode || nextData.originalCode;
//   const prevPrompt = prevData.prompt || prevData.metadata?.prompt || prevData.description;
//   const nextPrompt = nextData.prompt || nextData.metadata?.prompt || nextData.description;
//
//   // Only re-render if these specific properties change
//   return prevCode === nextCode &&
//          prevPrompt === nextPrompt &&
//          prevData.presentationMode === nextData.presentationMode &&
//          prevProps.selected === nextProps.selected;
// });

// Export the data type for use in other components
export type { ComponentNodeData };
