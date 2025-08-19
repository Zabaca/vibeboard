import { Handle, type NodeProps, NodeResizer, Position } from '@xyflow/react';
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import type { ComponentState, NativeComponentType } from '../types/native-component.types.ts';

// Import existing customizers and utilities
import ShapeCustomizer from './native/ShapeCustomizer.tsx';
import TextCustomizer from './native/TextCustomizer.tsx';
import CSVSpreadsheet from './native/CSVSpreadsheet.tsx';

interface UnifiedNativeNodeData {
  // Native component fields
  componentType: 'native';
  nativeType: NativeComponentType;
  state: ComponentState;
  source: 'native';
  id: string;

  // UI-specific fields
  presentationMode?: boolean;
  onDelete?: (nodeId: string) => void;
  onUpdateState?: (nodeId: string, newState: ComponentState) => void;

  // Index signature for React Flow compatibility
  [key: string]: unknown;
}

interface UnifiedNativeNodeProps extends NodeProps {
  data: UnifiedNativeNodeData;
}

// Sticky note color schemes
const stickyColors = {
  yellow: {
    background: '#fef3c7',
    border: '#fde68a',
    shadow: 'rgba(251, 191, 36, 0.2)',
    hover: '#fef9e7',
    text: '#78350f',
  },
  pink: {
    background: '#fce7f3',
    border: '#fbcfe8',
    shadow: 'rgba(236, 72, 153, 0.2)',
    hover: '#fdf2f8',
    text: '#831843',
  },
  blue: {
    background: '#dbeafe',
    border: '#bfdbfe',
    shadow: 'rgba(59, 130, 246, 0.2)',
    hover: '#eff6ff',
    text: '#1e3a8a',
  },
  green: {
    background: '#d1fae5',
    border: '#bbf7d0',
    shadow: 'rgba(34, 197, 94, 0.2)',
    hover: '#ecfdf5',
    text: '#14532d',
  },
};

/**
 * Get resize configuration based on native component type
 */
const getResizeConfig = (nativeType: NativeComponentType) => {
  switch (nativeType) {
    case 'shape':
      return {
        minWidth: 50,
        minHeight: 50,
        keepAspectRatio: false,
      };
    case 'text':
      return {
        minWidth: 50,
        minHeight: 30,
        keepAspectRatio: false,
      };
    case 'sticky':
      return {
        minWidth: 100,
        minHeight: 100,
        keepAspectRatio: false,
      };
    case 'image':
      return {
        minWidth: 50,
        minHeight: 50,
        keepAspectRatio: true,
      };
    case 'csv':
      return {
        minWidth: 400,
        minHeight: 200,
        keepAspectRatio: false,
      };
    default:
      return {
        minWidth: 50,
        minHeight: 50,
        keepAspectRatio: false,
      };
  }
};

const UnifiedNativeNode = ({ id, data, selected = false }: UnifiedNativeNodeProps) => {
  const { nativeType, state, presentationMode, onDelete, onUpdateState } = data;

  // Common state for editing functionality
  const [isEditing, setIsEditing] = useState(false);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [tempText, setTempText] = useState(state.text || '');

  // Refs for different component types
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasInitializedEditingRef = useRef(false);

  // Get resize configuration for this component type
  const resizeConfig = getResizeConfig(nativeType);

  // Auto-adjust textarea height for text components
  const adjustTextAreaHeight = useCallback(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = 'auto';
      textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
    }
  }, []);

  // Handle text editing focus
  useEffect(() => {
    if (isEditing && !hasInitializedEditingRef.current) {
      hasInitializedEditingRef.current = true;
      if (nativeType === 'text' && textAreaRef.current) {
        textAreaRef.current.focus();
        textAreaRef.current.select();
      } else if (nativeType === 'shape' && textInputRef.current) {
        textInputRef.current.focus();
        textInputRef.current.select();
      }
    } else if (!isEditing) {
      hasInitializedEditingRef.current = false;
    }
  }, [isEditing, nativeType]);

  // Auto-adjust textarea height when editing
  useEffect(() => {
    if (isEditing && nativeType === 'text') {
      adjustTextAreaHeight();
    }
  }, [isEditing, nativeType, adjustTextAreaHeight]);

  // Text submission handlers
  const handleTextSubmit = useCallback(() => {
    setIsEditing(false);
    if (onUpdateState && tempText !== state.text) {
      onUpdateState(id as string, { ...state, text: tempText });
    }
  }, [onUpdateState, id, state, tempText]);

  const handleTextKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (
        e.key === 'Enter' &&
        (nativeType === 'shape' || (nativeType === 'text' && (e.ctrlKey || e.metaKey)))
      ) {
        e.preventDefault();
        handleTextSubmit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setTempText(state.text || '');
        setIsEditing(false);
      }
    },
    [handleTextSubmit, state.text, nativeType],
  );

  const handleTextEdit = useCallback(() => {
    if (!(presentationMode || state.locked)) {
      setTempText(state.text || '');
      setIsEditing(true);
    }
  }, [presentationMode, state.locked, state.text]);

  /**
   * Render shape component
   */
  const renderShape = useCallback(() => {
    const {
      shapeType = 'rectangle',
      fillColor = '#ffffff',
      strokeColor = '#6366f1',
      strokeWidth = 2,
    } = state;

    const shapeElement = (() => {
      switch (shapeType) {
        case 'rectangle':
        case 'square':
          return (
            <rect
              x="2"
              y="2"
              width="96"
              height="96"
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              vectorEffect="non-scaling-stroke"
              rx="8"
              ry="8"
            />
          );
        case 'triangle':
          return (
            <polygon
              points="50,5 95,85 5,85"
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              vectorEffect="non-scaling-stroke"
            />
          );
        default:
          return (
            <rect
              x="2"
              y="2"
              width="96"
              height="96"
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              vectorEffect="non-scaling-stroke"
              rx="8"
              ry="8"
            />
          );
      }
    })();

    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8px',
          cursor: state.locked ? 'not-allowed' : 'move',
        }}
      >
        <svg
          width="100"
          height="100"
          viewBox="0 0 100 100"
          style={{
            width: '100%',
            height: '100%',
            minHeight: '100%',
          }}
          preserveAspectRatio="none"
        >
          {shapeElement}
        </svg>

        {/* Text overlay for shapes */}
        {state.text && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              pointerEvents: isEditing ? 'auto' : 'none',
              zIndex: 10,
            }}
          >
            {isEditing ? (
              <input
                ref={textInputRef}
                value={tempText}
                onChange={(e) => setTempText(e.target.value)}
                onBlur={handleTextSubmit}
                onKeyDown={handleTextKeyDown}
                style={{
                  background: 'transparent',
                  border: '1px dashed #6366f1',
                  textAlign: 'center',
                  fontSize: '14px',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  color: '#111827',
                  outline: 'none',
                  padding: '2px 4px',
                  borderRadius: '4px',
                  minWidth: '60px',
                }}
              />
            ) : (
              <div
                onDoubleClick={handleTextEdit}
                style={{
                  textAlign: 'center',
                  fontSize: '14px',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  color: '#111827',
                  userSelect: 'none',
                  wordBreak: 'break-word',
                  overflow: 'hidden',
                  width: '100%',
                  padding: '4px',
                }}
                title={presentationMode || state.locked ? undefined : 'Double-click to edit text'}
              >
                {state.text || ''}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }, [
    state,
    isEditing,
    tempText,
    handleTextEdit,
    handleTextSubmit,
    handleTextKeyDown,
    presentationMode,
  ]);

  /**
   * Render text component
   */
  const renderText = useCallback(() => {
    const {
      fontSize = 16,
      fontFamily = 'Inter, system-ui, sans-serif',
      fontWeight = '400',
      textAlign = 'left',
      textColor = '#111827',
    } = state;

    return (
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'flex-start',
          padding: '12px',
          background: 'transparent',
          cursor: state.locked ? 'not-allowed' : 'text',
        }}
        onDoubleClick={handleTextEdit}
      >
        {isEditing ? (
          <textarea
            ref={textAreaRef}
            value={tempText}
            onChange={(e) => setTempText(e.target.value)}
            onBlur={handleTextSubmit}
            onKeyDown={handleTextKeyDown}
            style={{
              width: '100%',
              minHeight: '24px',
              border: 'none',
              outline: 'none',
              background: 'transparent',
              resize: 'none',
              fontSize: `${fontSize}px`,
              fontFamily,
              fontWeight,
              textAlign,
              color: textColor,
              lineHeight: '1.4',
              overflow: 'hidden',
            }}
            placeholder="Type your text..."
          />
        ) : (
          <div
            style={{
              width: '100%',
              fontSize: `${fontSize}px`,
              fontFamily,
              fontWeight,
              textAlign,
              color: textColor,
              lineHeight: '1.4',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              userSelect: presentationMode || state.locked ? 'none' : 'text',
            }}
          >
            {state.text || 'Text'}
          </div>
        )}
      </div>
    );
  }, [
    state,
    isEditing,
    tempText,
    handleTextEdit,
    handleTextSubmit,
    handleTextKeyDown,
    presentationMode,
  ]);

  /**
   * Render sticky note component
   */
  const renderSticky = useCallback(() => {
    const stickyColor = state.stickyColor || 'yellow';
    const colors = stickyColors[stickyColor] || stickyColors.yellow;
    const {
      fontSize = 14,
      fontFamily = 'Inter, system-ui, sans-serif',
      textColor = colors.text,
      padding = 16,
    } = state;

    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: colors.background,
          border: `2px solid ${colors.border}`,
          borderRadius: '8px',
          padding: `${padding}px`,
          boxShadow: `0 4px 12px ${colors.shadow}`,
          cursor: state.locked ? 'not-allowed' : 'move',
          transition: 'all 0.2s ease',
          position: 'relative',
        }}
        onDoubleClick={handleTextEdit}
      >
        {isEditing ? (
          <textarea
            ref={textAreaRef}
            value={tempText}
            onChange={(e) => setTempText(e.target.value)}
            onBlur={handleTextSubmit}
            onKeyDown={handleTextKeyDown}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              outline: 'none',
              background: 'transparent',
              resize: 'none',
              fontSize: `${fontSize}px`,
              fontFamily,
              color: textColor,
              lineHeight: '1.4',
            }}
            placeholder="Type your note..."
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              fontSize: `${fontSize}px`,
              fontFamily,
              color: textColor,
              lineHeight: '1.4',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              overflow: 'hidden',
              userSelect: presentationMode || state.locked ? 'none' : 'text',
            }}
          >
            {state.text || ''}
          </div>
        )}

        {/* Sticky note fold effect */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '20px',
            height: '20px',
            background: `linear-gradient(-45deg, transparent 50%, ${colors.border} 50%)`,
            borderTopRightRadius: '8px',
          }}
        />
      </div>
    );
  }, [
    state,
    isEditing,
    tempText,
    handleTextEdit,
    handleTextSubmit,
    handleTextKeyDown,
    presentationMode,
  ]);

  /**
   * Render image component
   */
  const renderImage = useCallback(() => {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px dashed #d1d5db',
          borderRadius: '8px',
          backgroundColor: '#f9fafb',
          cursor: state.locked ? 'not-allowed' : 'move',
        }}
      >
        {state.blobUrl ? (
          <img
            src={state.blobUrl}
            alt={state.alt || 'Pasted image'}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              borderRadius: '6px',
            }}
          />
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              color: '#6b7280',
              fontSize: '14px',
            }}
          >
            <span style={{ fontSize: '24px', marginBottom: '8px' }}>🖼️</span>
            <span>Image</span>
          </div>
        )}
      </div>
    );
  }, [state]);

  /**
   * Render CSV spreadsheet component using original component
   */
  const renderCSV = useCallback(() => {
    // Create the same props structure as the original CSVSpreadsheet expects
    const csvNodeProps = {
      id,
      data: {
        ...data,
        componentType: 'native' as const,
        nativeType: 'csv' as const,
        state,
        source: 'native' as const,
      },
      selected,
      type: 'native',
      dragging: false,
      draggable: true,
      selectable: true,
      deletable: true,
      zIndex: 0,
      isConnectable: false,
      positionAbsoluteX: 0,
      positionAbsoluteY: 0,
    };

    // Use the original CSVSpreadsheet component for full functionality
    return <CSVSpreadsheet {...csvNodeProps} />;
  }, [id, data, state, selected]);

  /**
   * Render component content based on native type
   */
  const renderContent = () => {
    switch (nativeType) {
      case 'shape':
        return renderShape();
      case 'text':
        return renderText();
      case 'sticky':
        return renderSticky();
      case 'image':
        return renderImage();
      case 'csv':
        // For CSV, we render the original component directly and don't show additional controls
        // since the original component has its own controls
        return (
          <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            {renderCSV()}
          </div>
        );
      default:
        return (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px dashed #d1d5db',
              borderRadius: '8px',
              color: '#6b7280',
            }}
          >
            Unknown component type: {nativeType}
          </div>
        );
    }
  };

  /**
   * Render controls for all component types
   */
  const renderControls = () => {
    if (presentationMode || state.locked) {
      return null;
    }

    // CSV components handle their own controls, so don't show additional ones
    if (nativeType === 'csv') {
      return null;
    }

    // All other native components should have delete controls
    const hasCustomizer = nativeType === 'shape' || nativeType === 'text';

    return (
      <div
        className="nodrag"
        style={{
          position: 'absolute',
          top: '-32px',
          right: '0',
          display: selected ? 'flex' : 'none',
          gap: '4px',
          background: 'white',
          padding: '4px',
          borderRadius: '6px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        {/* Customize button - only for components that have customizers */}
        {hasCustomizer && (
          <button
            type="button"
            onClick={() => setShowCustomizer(!showCustomizer)}
            style={{
              background: showCustomizer ? '#eef2ff' : 'transparent',
              color: showCustomizer ? '#6366f1' : '#6b7280',
              border: 'none',
              borderRadius: '4px',
              padding: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '24px',
              height: '24px',
            }}
            title="Customize"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L19 8L21 9ZM22 17C22 18.1 21.1 19 20 19C18.9 19 18 18.1 18 17C18 15.9 18.9 15 20 15C21.1 15 22 15.9 22 17ZM5.6 10.25L7.03 8.82C7.42 8.43 8.05 8.43 8.44 8.82L10.25 10.63C10.64 11.02 10.64 11.65 10.25 12.04L8.82 13.47C8.43 13.86 7.8 13.86 7.41 13.47L5.6 11.66C5.21 11.27 5.21 10.64 5.6 10.25Z" />
            </svg>
          </button>
        )}

        {/* Delete button */}
        <button
          type="button"
          onClick={() => onDelete?.(id as string)}
          style={{
            background: 'transparent',
            color: '#ef4444',
            border: 'none',
            borderRadius: '4px',
            padding: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '24px',
            height: '24px',
          }}
          title="Delete"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18" />
            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" />
            <path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
          </svg>
        </button>
      </div>
    );
  };

  /**
   * Render customizer overlay
   */
  const renderCustomizer = () => {
    if (!showCustomizer) {
      return null;
    }

    switch (nativeType) {
      case 'shape':
        return (
          <ShapeCustomizer
            state={state}
            onUpdateState={(newState) => onUpdateState?.(id as string, newState)}
            onClose={() => setShowCustomizer(false)}
          />
        );
      case 'text':
        return (
          <TextCustomizer
            state={state}
            onUpdateState={(newState) => onUpdateState?.(id as string, newState)}
            onClose={() => setShowCustomizer(false)}
          />
        );
      default:
        return null;
    }
  };

  // For CSV components, render the original component directly without wrapper elements
  if (nativeType === 'csv') {
    return renderContent();
  }

  // For all other components, use the standard wrapper with controls
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
      }}
    >
      {/* Node Resizer - only show if not locked */}
      {!state.locked && (
        <NodeResizer
          minWidth={resizeConfig.minWidth}
          minHeight={resizeConfig.minHeight}
          keepAspectRatio={resizeConfig.keepAspectRatio}
          isVisible={selected && !(presentationMode as boolean)}
          handleStyle={{
            width: '10px',
            height: '10px',
            backgroundColor: '#6366f1',
            border: '2px solid white',
            borderRadius: '3px',
          }}
          lineStyle={{
            borderColor: '#6366f1',
            borderWidth: '2px',
          }}
        />
      )}

      {/* Component content */}
      {renderContent()}

      {/* Control buttons */}
      {renderControls()}

      {/* Customizer overlay */}
      {renderCustomizer()}

      {/* React Flow handles (for connections) */}
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: '#6366f1',
          width: '8px',
          height: '8px',
          border: '2px solid white',
          display: presentationMode ? 'none' : 'block',
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: '#6366f1',
          width: '8px',
          height: '8px',
          border: '2px solid white',
          display: presentationMode ? 'none' : 'block',
        }}
      />
    </div>
  );
};

export default memo(UnifiedNativeNode);
