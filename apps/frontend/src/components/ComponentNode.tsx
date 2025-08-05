import { memo, useMemo } from 'react';
import { Handle, Position, NodeResizer, type NodeProps } from '@xyflow/react';
import GeneratedApp from './GeneratedApp.tsx';
import { AsyncComponentLoader } from './AsyncComponentLoader.tsx';
import type { UnifiedComponentNode } from '../types/component.types.ts';

interface ComponentNodeData extends UnifiedComponentNode {
  // Legacy fields for backward compatibility
  code?: string; // Will be mapped to originalCode
  prompt?: string; // Will be mapped to metadata.prompt
  generationTime?: number; // Will be mapped to metadata.generationTime
  
  // UI-specific fields
  presentationMode?: boolean;
  onDelete?: (appId: string) => void;
  onRegenerate?: (appId: string, prompt: string) => void;
  onDuplicate?: (nodeData: ComponentNodeData) => void;
  onCompilationComplete?: (nodeId: string, compiledCode: string, hash: string) => void;
  
  // Index signature for React Flow compatibility
  [key: string]: unknown;
}

type ComponentNodeProps = NodeProps;

const ComponentNode = ({ id, data, selected = false }: ComponentNodeProps) => {
  const nodeData = data as ComponentNodeData;
  
  // Support both legacy and new data structure
  const code = nodeData.code || nodeData.compiledCode || nodeData.originalCode;
  const prompt = nodeData.prompt || nodeData.metadata?.prompt || nodeData.description;
  const generationTime = nodeData.generationTime || nodeData.metadata?.generationTime;
  const { presentationMode, onDelete, onRegenerate, onDuplicate, onCompilationComplete } = nodeData;
  
  // Create a UnifiedComponentNode from the data
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
  
  // Memoize the GeneratedApp component to prevent re-renders unless data changes
  const generatedAppComponent = useMemo(() => {
    // Check if this is a URL-imported ES module
    const isUrlImport = unifiedComponent.source === 'url-import' && 
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
          presentationMode={presentationMode || false}
          debug={false}
          cache={true}
          fallback={<div style={{ padding: '20px', textAlign: 'center' }}>Loading module...</div>}
          onError={(error) => console.error('Module load error:', error)}
        />
      );
    }
    
    // Use GeneratedApp for AI-generated code that needs compilation
    if (!code && !unifiedComponent.compiledCode) return null;
    return (
      <GeneratedApp 
        key={`generated-app-${id}`}
        component={unifiedComponent}
        presentationMode={presentationMode || false}
        onCompilationComplete={onCompilationComplete ? (compiledCode, hash) => 
          onCompilationComplete(id, compiledCode, hash) : undefined}
      />
    );
  }, [unifiedComponent, code, presentationMode, onCompilationComplete, id]);

  // Render function to avoid conditional early returns
  const renderContent = () => {
    // In presentation mode, show only the component
    if (presentationMode) {
      return (
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: 'transparent',
            position: 'relative',
          }}
        >
          {generatedAppComponent ? (
            <div style={{ 
              width: '100%', 
              height: '100%',
              // Override the white background in GeneratedApp
              backgroundColor: 'transparent',
            }}>
              {generatedAppComponent}
            </div>
          ) : (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%',
              color: '#9ca3af',
              backgroundColor: 'rgba(255, 255, 255, 0.5)',
              borderRadius: '8px',
              padding: '20px',
            }}>
              No component generated yet
            </div>
          )}
        </div>
      );
    }

    // Normal mode with full chrome
    return (
    <div
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
        <div style={{
          position: 'absolute',
          left: '50%',
          top: '4px',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '2px',
        }}>
          <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#d1d5db' }} />
          <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#d1d5db' }} />
          <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#d1d5db' }} />
        </div>
        
        <div style={{ 
          flex: 1, 
          minWidth: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginTop: '6px',
        }}>
          {/* Modern status indicator */}
          <div style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: code ? '#10b981' : '#fbbf24',
            boxShadow: code ? '0 0 8px rgba(16, 185, 129, 0.4)' : '0 0 8px rgba(251, 191, 36, 0.4)',
            animation: code ? 'none' : 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          }} />
          
          {/* Title and meta info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontWeight: '600',
              fontSize: '12px',
              color: '#111827',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {prompt ? prompt.substring(0, 30) : 'AI Component'}
              {prompt && prompt.length > 30 ? '...' : ''}
            </div>
            {generationTime && (
              <div style={{
                fontSize: '10px',
                color: '#9ca3af',
                marginTop: '2px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
        <div className="nodrag" style={{ 
          display: 'flex', 
          gap: '2px', 
          marginLeft: '8px',
          marginTop: '6px',
        }}>
          {onRegenerate && (
            <button
              className="nodrag"
              onClick={(e) => {
                e.stopPropagation();
                onRegenerate(id, prompt || '');
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
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%',
            color: '#9ca3af'
          }}>
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

  // Main component return - always calls renderContent()
  return renderContent();
};

// Memo with custom comparison to prevent unnecessary re-renders
// Only re-render when code, prompt, or presentationMode changes
export default memo(ComponentNode, (prevProps, nextProps) => {
  // Check if data exists
  if (!prevProps.data && !nextProps.data) return true;
  if (!prevProps.data || !nextProps.data) return false;
  
  const prevData = prevProps.data as unknown as ComponentNodeData;
  const nextData = nextProps.data as unknown as ComponentNodeData;
  
  // Check both legacy and new fields for changes
  const prevCode = prevData.code || prevData.compiledCode || prevData.originalCode;
  const nextCode = nextData.code || nextData.compiledCode || nextData.originalCode;
  const prevPrompt = prevData.prompt || prevData.metadata?.prompt || prevData.description;
  const nextPrompt = nextData.prompt || nextData.metadata?.prompt || nextData.description;
  
  // Only re-render if these specific properties change
  return prevCode === nextCode &&
         prevPrompt === nextPrompt &&
         prevData.presentationMode === nextData.presentationMode &&
         prevProps.selected === nextProps.selected;
});

// Export the data type for use in other components
export type { ComponentNodeData };