import React, { memo, useState, useRef, useEffect } from 'react';
import { Handle, Position, NodeResizer, type NodeProps } from '@xyflow/react';
import type { NativeComponentNode, ComponentState } from '../../types/native-component.types.ts';
import TextCustomizer from './TextCustomizer.tsx';

interface TextNodeData extends NativeComponentNode {
  // UI-specific fields
  presentationMode?: boolean;
  onDelete?: (nodeId: string) => void;
  onUpdateState?: (nodeId: string, newState: ComponentState) => void;
}

type TextNodeProps = NodeProps<TextNodeData>;

const TextNode = ({ id, data, selected = false }: TextNodeProps) => {
  const { state, presentationMode, onDelete, onUpdateState } = data;
  const [isEditing, setIsEditing] = useState(false);
  const [tempText, setTempText] = useState(state.text || 'Text');
  const [showCustomizer, setShowCustomizer] = useState(false);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-focus and select text when editing starts
  useEffect(() => {
    if (isEditing && textAreaRef.current) {
      textAreaRef.current.focus();
      textAreaRef.current.select();
      // Auto-resize textarea to fit content
      adjustTextAreaHeight();
    }
  }, [isEditing]);

  // Adjust textarea height based on content
  const adjustTextAreaHeight = () => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = 'auto';
      textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
    }
  };

  const handleTextSubmit = () => {
    setIsEditing(false);
    if (onUpdateState && tempText !== state.text) {
      onUpdateState(id, { ...state, text: tempText });
    }
  };

  const handleTextKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setTempText(state.text || 'Text');
      setIsEditing(false);
    }
    // Allow Enter for new lines in text
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTempText(e.target.value);
    adjustTextAreaHeight();
  };

  const startEditing = () => {
    if (!presentationMode && !state.locked) {
      setIsEditing(true);
    }
  };

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        minWidth: '100px',
        minHeight: '40px',
        position: 'relative',
        cursor: state.locked ? 'not-allowed' : 'move',
        background: 'transparent',
      }}
    >
      {/* Node Resizer - only show if not locked */}
      {!state.locked && (
        <NodeResizer
          minWidth={50}
          minHeight={30}
          isVisible={selected && !presentationMode}
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

      {/* Text content */}
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'flex-start',
          padding: '8px',
        }}
      >
        {isEditing ? (
          <textarea
            ref={textAreaRef}
            value={tempText}
            onChange={handleTextChange}
            onBlur={handleTextSubmit}
            onKeyDown={handleTextKeyDown}
            style={{
              width: '100%',
              minHeight: '100%',
              background: 'rgba(255, 255, 255, 0.9)',
              border: '2px solid #6366f1',
              borderRadius: '4px',
              outline: 'none',
              resize: 'none',
              padding: '4px 6px',
              fontSize: state.fontSize || 16,
              fontFamily: state.fontFamily || 'Inter, system-ui, sans-serif',
              fontWeight: state.fontWeight || '400',
              textAlign: state.textAlign || 'left',
              color: state.textColor || '#111827',
              lineHeight: 1.5,
              overflow: 'hidden',
            }}
            className="nodrag"
          />
        ) : (
          <div
            onClick={startEditing}
            onDoubleClick={startEditing}
            style={{
              width: '100%',
              minHeight: '100%',
              fontSize: state.fontSize || 16,
              fontFamily: state.fontFamily || 'Inter, system-ui, sans-serif',
              fontWeight: state.fontWeight || '400',
              textAlign: state.textAlign || 'left',
              color: state.textColor || '#111827',
              cursor: !presentationMode && !state.locked ? 'text' : 'default',
              userSelect: presentationMode ? 'text' : 'none',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              lineHeight: 1.5,
              padding: '4px 6px',
              borderRadius: '4px',
              background: selected && !presentationMode ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
              border: selected && !presentationMode ? '1px dashed rgba(99, 102, 241, 0.3)' : '1px solid transparent',
              transition: 'all 0.2s ease',
            }}
            title={!presentationMode && !state.locked ? 'Click to edit text' : undefined}
          >
            {state.text || 'Text'}
          </div>
        )}
      </div>

      {/* Control buttons - only show if not in presentation mode and not locked */}
      {!presentationMode && !state.locked && selected && (
        <div
          className="nodrag"
          style={{
            position: 'absolute',
            top: '-36px',
            right: '0',
            display: 'flex',
            gap: '4px',
            background: 'white',
            padding: '4px',
            borderRadius: '6px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          {/* Text formatting button */}
          <button
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
            title="Text formatting"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 7V4h16v3" />
              <path d="M9 20h6" />
              <path d="M12 4v16" />
            </svg>
          </button>

          {/* Lock button */}
          <button
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
            title="Lock text"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="5" y="11" width="14" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
          </button>

          {/* Delete button */}
          {onDelete && (
            <button
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
              title="Delete text"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18" />
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" />
                <path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Unlock indicator for locked text */}
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
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
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

      {/* Text Customizer */}
      {showCustomizer && onUpdateState && (
        <TextCustomizer
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

export default memo(TextNode);