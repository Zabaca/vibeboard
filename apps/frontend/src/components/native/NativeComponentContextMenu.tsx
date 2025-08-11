import React from 'react';
import type { NativeComponentType } from '../../types/native-component.types.ts';

interface ContextMenuProps {
  x: number;
  y: number;
  nodeId: string;
  nodeType: NativeComponentType;
  onClose: () => void;
  onDelete: (nodeId: string) => void;
  onDuplicate: (nodeId: string) => void;
  onBringToFront: (nodeId: string) => void;
  onSendToBack: (nodeId: string) => void;
}

const NativeComponentContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  nodeId,
  nodeType,
  onClose,
  onDelete,
  onDuplicate,
  onBringToFront,
  onSendToBack,
}) => {
  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <>
      {/* Backdrop to close menu when clicking outside */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
        }}
        onClick={onClose}
      />

      {/* Context menu */}
      <div
        style={{
          position: 'fixed',
          top: y,
          left: x,
          zIndex: 10000,
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          padding: '8px',
          minWidth: '180px',
          fontSize: '14px',
        }}
      >
        <div
          style={{
            padding: '4px 12px',
            fontSize: '12px',
            fontWeight: '600',
            color: '#6b7280',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          {nodeType} Options
        </div>

        <div
          style={{
            width: '100%',
            height: '1px',
            background: '#e5e7eb',
            margin: '4px 0',
          }}
        />

        <button
          onClick={() => handleAction(() => onDuplicate(nodeId))}
          style={{
            display: 'block',
            width: '100%',
            padding: '8px 12px',
            border: 'none',
            background: 'transparent',
            textAlign: 'left',
            cursor: 'pointer',
            borderRadius: '4px',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f3f4f6';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <span style={{ marginRight: '8px' }}>📋</span>
          Duplicate
        </button>

        <button
          onClick={() => handleAction(() => onBringToFront(nodeId))}
          style={{
            display: 'block',
            width: '100%',
            padding: '8px 12px',
            border: 'none',
            background: 'transparent',
            textAlign: 'left',
            cursor: 'pointer',
            borderRadius: '4px',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f3f4f6';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <span style={{ marginRight: '8px' }}>⬆️</span>
          Bring to Front
        </button>

        <button
          onClick={() => handleAction(() => onSendToBack(nodeId))}
          style={{
            display: 'block',
            width: '100%',
            padding: '8px 12px',
            border: 'none',
            background: 'transparent',
            textAlign: 'left',
            cursor: 'pointer',
            borderRadius: '4px',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f3f4f6';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <span style={{ marginRight: '8px' }}>⬇️</span>
          Send to Back
        </button>

        <div
          style={{
            width: '100%',
            height: '1px',
            background: '#e5e7eb',
            margin: '4px 0',
          }}
        />

        <button
          onClick={() => handleAction(() => onDelete(nodeId))}
          style={{
            display: 'block',
            width: '100%',
            padding: '8px 12px',
            border: 'none',
            background: 'transparent',
            textAlign: 'left',
            cursor: 'pointer',
            borderRadius: '4px',
            transition: 'background 0.2s',
            color: '#dc2626',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#fee2e2';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <span style={{ marginRight: '8px' }}>🗑️</span>
          Delete
        </button>
      </div>
    </>
  );
};

export default NativeComponentContextMenu;
