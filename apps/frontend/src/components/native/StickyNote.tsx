// @ts-nocheck
import React, { memo, useState, useRef, useEffect } from 'react';
import { Handle, Position, NodeResizer, type NodeProps } from '@xyflow/react';
import type { NativeComponentNode, ComponentState } from '../../types/native-component.types.ts';

interface StickyNoteData {
  // Native component fields
  componentType: 'native';
  nativeType: 'sticky';
  state: ComponentState;
  source: 'native';
  id: string;
  
  // UI-specific fields
  presentationMode?: boolean;
  onDelete?: (nodeId: string) => void;
  onUpdateState?: (nodeId: string, newState: ComponentState) => void;
}

type StickyNoteProps = NodeProps<Record<string, unknown>>;

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
    border: '#a7f3d0',
    shadow: 'rgba(16, 185, 129, 0.2)',
    hover: '#ecfdf5',
    text: '#064e3b',
  },
};

const StickyNote = ({ id, data, selected = false }: StickyNoteProps) => {
  const { state, presentationMode, onDelete, onUpdateState } = data as StickyNoteData;
  const [isEditing, setIsEditing] = useState(false);
  const [tempText, setTempText] = useState(state.text || '');
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const colorScheme = stickyColors[(state.stickyColor as keyof typeof stickyColors) || 'yellow'];

  // Adjust textarea height based on content
  const adjustTextAreaHeight = () => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = 'auto';
      const newHeight = Math.max(100, textAreaRef.current.scrollHeight);
      textAreaRef.current.style.height = `${newHeight}px`;
      
      // Update node height if auto-resize is enabled
      if (containerRef.current && !state.locked) {
        const padding = 32; // Account for padding
        containerRef.current.style.minHeight = `${newHeight + padding}px`;
      }
    }
  };

  // Auto-focus and adjust height when editing starts
  useEffect(() => {
    if (isEditing && textAreaRef.current) {
      textAreaRef.current.focus();
      adjustTextAreaHeight();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing]);

  const handleTextSubmit = () => {
    setIsEditing(false);
    if (onUpdateState && tempText !== state.text) {
      onUpdateState(id, { ...state, text: tempText });
    }
  };

  const handleTextKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setTempText(state.text || '');
      setIsEditing(false);
    }
    // Allow Enter for new lines
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

  const cycleColor = () => {
    if (!presentationMode && !state.locked && onUpdateState) {
      const colors = Object.keys(stickyColors) as Array<keyof typeof stickyColors>;
      const currentIndex = colors.indexOf(state.stickyColor || 'yellow');
      const nextIndex = (currentIndex + 1) % colors.length;
      onUpdateState(id, { ...state, stickyColor: colors[nextIndex] });
    }
  };

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        minWidth: '150px',
        minHeight: '150px',
        position: 'relative',
        cursor: state.locked ? 'not-allowed' : 'move',
      }}
    >
      {/* Node Resizer - only show if not locked */}
      {!state.locked && (
        <NodeResizer
          minWidth={100}
          minHeight={100}
          isVisible={selected && !(presentationMode as boolean)}
          handleStyle={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: colorScheme.border,
            border: '2px solid white',
          }}
          lineStyle={{
            stroke: colorScheme.border,
            strokeWidth: 2,
            strokeDasharray: '5 5',
          }}
        />
      )}

      {/* Sticky note paper effect */}
      <div
        style={{
          width: '100%',
          height: '100%',
          background: colorScheme.background,
          border: `2px solid ${colorScheme.border}`,
          borderRadius: '2px',
          boxShadow: `0 4px 12px ${colorScheme.shadow}`,
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.2s ease',
          transform: selected ? 'scale(1.02)' : 'scale(1)',
        }}
      >
        {/* Paper fold effect */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '20px',
            height: '20px',
            background: `linear-gradient(135deg, transparent 50%, ${colorScheme.border} 50%)`,
            borderBottomLeftRadius: '100%',
          }}
        />

        {/* Text content */}
        <div
          style={{
            width: '100%',
            height: '100%',
            padding: state.padding || 16,
            display: 'flex',
            flexDirection: 'column',
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
                background: 'transparent',
                border: 'none',
                outline: 'none',
                resize: 'none',
                fontSize: state.fontSize || 14,
                fontFamily: state.fontFamily || 'Inter, system-ui, sans-serif',
                fontWeight: '400',
                color: colorScheme.text,
                lineHeight: 1.6,
                overflow: 'hidden',
              }}
              placeholder="Write your note here..."
              className="nodrag"
            />
          ) : (
            <div
              onClick={startEditing}
              style={{
                width: '100%',
                minHeight: '100%',
                fontSize: state.fontSize || 14,
                fontFamily: state.fontFamily || 'Inter, system-ui, sans-serif',
                fontWeight: '400',
                color: colorScheme.text,
                cursor: !presentationMode && !state.locked ? 'text' : 'default',
                userSelect: presentationMode ? 'text' : 'none',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                lineHeight: 1.6,
              }}
              title={!presentationMode && !state.locked ? 'Click to edit note' : undefined}
            >
              {state.text || 'Click to add note...'}
            </div>
          )}
        </div>
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
          {/* Color picker button */}
          <button
            onClick={cycleColor}
            style={{
              background: colorScheme.background,
              border: `1px solid ${colorScheme.border}`,
              borderRadius: '4px',
              padding: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '24px',
              height: '24px',
              position: 'relative',
            }}
            title="Change color"
          >
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: colorScheme.border,
              }}
            />
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
            title="Lock note"
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
              title="Delete note"
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

      {/* Unlock indicator for locked notes */}
      {state.locked && !presentationMode && (
        <div
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            background: 'rgba(255, 255, 255, 0.8)',
            borderRadius: '4px',
            padding: '2px',
            cursor: 'pointer',
          }}
          onClick={() => onUpdateState?.(id, { ...state, locked: false })}
          title="Click to unlock"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colorScheme.text} strokeWidth="2">
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
              background: colorScheme.border,
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
              background: colorScheme.border,
              border: '2px solid white',
              visibility: selected ? 'visible' : 'hidden',
            }}
          />
        </>
      )}
    </div>
  );
};

export default memo(StickyNote);