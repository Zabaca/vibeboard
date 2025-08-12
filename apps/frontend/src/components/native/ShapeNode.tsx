import { Handle, type NodeProps, NodeResizer, Position } from '@xyflow/react';
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import type { ComponentState } from '../../types/native-component.types.ts';
import ShapeCustomizer from './ShapeCustomizer.tsx';

interface ShapeNodeData {
  // Native component fields
  componentType: 'native';
  nativeType: 'shape';
  state: ComponentState;
  source: 'native';
  id: string;

  // UI-specific fields
  presentationMode?: boolean;
  onDelete?: (nodeId: string) => void;
  onUpdateState?: (nodeId: string, newState: ComponentState) => void;
}

type ShapeNodeProps = NodeProps;

const ShapeNode = ({ id, data, selected = false }: ShapeNodeProps) => {
  const shapeData = data as unknown as ShapeNodeData;
  const { state, presentationMode, onDelete, onUpdateState } = shapeData;
  const [isEditingText, setIsEditingText] = useState(false);
  const [tempText, setTempText] = useState((state as unknown as { text?: string })?.text || '');
  const [showCustomizer, setShowCustomizer] = useState(false);
  const textInputRef = useRef<HTMLInputElement>(null);

  // Handle text editing
  useEffect(() => {
    if (isEditingText && textInputRef.current) {
      textInputRef.current.focus();
      textInputRef.current.select();
    }
  }, [isEditingText]);

  const handleTextSubmit = useCallback(() => {
    setIsEditingText(false);
    if (onUpdateState && tempText !== (state as unknown as { text?: string }).text) {
      onUpdateState(id as string, { ...state, text: tempText });
    }
  }, [onUpdateState, id, state, tempText]);

  const handleTextKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTextSubmit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setTempText(state.text || '');
      setIsEditingText(false);
    }
  }, [handleTextSubmit, state.text]);

  const handleTextEdit = useCallback(() => {
    if (!(presentationMode || state.locked)) {
      setIsEditingText(true);
    }
  }, [presentationMode, state.locked]);

  // Render different shapes based on shapeType
  const renderShape = useCallback(() => {
    const {
      shapeType = 'rectangle',
      fillColor = '#ffffff',
      strokeColor = '#6366f1',
      strokeWidth = 2,
    } = state;

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
        return null;
    }
  }, [state]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        minWidth: '100px',
        minHeight: '100px',
        position: 'relative',
        cursor: state.locked ? 'not-allowed' : 'move',
      }}
    >
      {/* Node Resizer - only show if not locked */}
      {!state.locked && (
        <NodeResizer
          minWidth={50}
          minHeight={50}
          isVisible={selected && !(presentationMode as boolean)}
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
      )}

      {/* Shape SVG */}
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: state.locked ? 'none' : 'auto',
        }}
      >
        {renderShape()}
      </svg>

      {/* Text inside shape */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '80%',
          height: '80%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: isEditingText ? 'auto' : 'none',
        }}
      >
        {isEditingText ? (
          <input
            ref={textInputRef}
            type="text"
            value={tempText}
            onChange={(e) => setTempText(e.target.value)}
            onBlur={handleTextSubmit}
            onKeyDown={handleTextKeyDown}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              textAlign: 'center',
              fontSize: state.fontSize || 16,
              fontFamily: state.fontFamily || 'Inter, system-ui, sans-serif',
              fontWeight: state.fontWeight || '400',
              color: state.textColor || '#111827',
              padding: '4px',
            }}
            className="nodrag"
          />
        ) : (
          <div
            onDoubleClick={handleTextEdit}
            style={{
              textAlign: state.textAlign || 'center',
              fontSize: state.fontSize || 16,
              fontFamily: state.fontFamily || 'Inter, system-ui, sans-serif',
              fontWeight: state.fontWeight || '400',
              color: state.textColor || '#111827',
              cursor: presentationMode || state.locked ? 'default' : 'text',
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

      {/* Control buttons - only show if not in presentation mode and not locked */}
      {!(presentationMode || state.locked) && (
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
          {/* Customize button */}
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
            title="Customize shape"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" />
            </svg>
          </button>

          {/* Lock button */}
          <button
            type="button"
            onClick={() => onUpdateState?.(id, { ...state, locked: true })}
            style={{
              background: 'transparent',
              color: '#6b7280',
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
            title="Lock shape"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="5" y="11" width="14" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
          </button>

          {/* Delete button */}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(id)}
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
              title="Delete shape"
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
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" />
                <path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Unlock indicator for locked shapes */}
      {state.locked && !presentationMode && (
        <div
          style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            background: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '4px',
            padding: '2px',
            cursor: 'pointer',
          }}
          onClick={() => onUpdateState?.(id, { ...state, locked: false })}
          title="Click to unlock"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#6b7280"
            strokeWidth="2"
          >
            <rect x="5" y="11" width="14" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
        </div>
      )}

      {/* Connection handles */}
      {!presentationMode && (
        <>
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
        </>
      )}

      {/* Shape Customizer */}
      {showCustomizer && onUpdateState && (
        <ShapeCustomizer
          state={state}
          onUpdateState={(newState) => {
            onUpdateState(id, newState);
          }}
          onClose={() => setShowCustomizer(false)}
        />
      )}
    </div>
  );
};

export default memo(ShapeNode);
