import React, { useState } from 'react';
import type { NativeComponentType } from '../../types/native-component.types.ts';

interface ToolbarButton {
  type: NativeComponentType | 'shape-rectangle' | 'shape-square' | 'shape-triangle';
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
}

interface NativeComponentsToolbarProps {
  onCreateComponent: (type: NativeComponentType, subType?: string) => void;
  isCreating?: boolean;
}

const NativeComponentsToolbar: React.FC<NativeComponentsToolbarProps> = ({
  onCreateComponent,
  isCreating = false,
}) => {
  const [selectedTool, setSelectedTool] = useState<string | null>(null);

  const handleButtonClick = (button: ToolbarButton) => {
    if (button.type.startsWith('shape-')) {
      const shapeType = button.type.replace('shape-', '');
      onCreateComponent('shape', shapeType);
    } else {
      onCreateComponent(button.type as NativeComponentType);
    }
    setSelectedTool(button.type);
    // Clear selection after a moment
    setTimeout(() => setSelectedTool(null), 300);
  };

  const allButtons: ToolbarButton[] = [
    {
      type: 'shape-rectangle',
      label: 'Rectangle',
      shortcut: 'R',
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="3" y="5" width="18" height="14" rx="2" />
        </svg>
      ),
    },
    {
      type: 'shape-triangle',
      label: 'Triangle',
      shortcut: 'G',
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 2L2 20h20L12 2z" />
        </svg>
      ),
    },
    {
      type: 'text',
      label: 'Text',
      shortcut: 'T',
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M4 7V4h16v3" />
          <path d="M9 20h6" />
          <path d="M12 4v16" />
        </svg>
      ),
    },
    {
      type: 'sticky',
      label: 'Sticky Note',
      shortcut: 'S',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path
            d="M16 3H5c-.55 0-1 .45-1 1v14c0 .55.45 1 1 1h14c.55 0 1-.45 1-1V7l-4-4z"
            fill="#fef3c7"
            stroke="#fbbf24"
            strokeWidth="1"
          />
          <path d="M16 3v4h4" fill="#fbbf24" />
        </svg>
      ),
    },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        left: '16px',
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 10,
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          minWidth: '100px',
        }}
      >
        <div
          style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#111827',
            textAlign: 'center',
            padding: '4px 0',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          Tools
        </div>

        <div
          style={{
            width: '100%',
            height: '1px',
            background: '#e5e7eb',
            margin: '4px 0',
          }}
        />

        {/* All tools as direct buttons */}
        {allButtons.map((button) => (
          <button
            type="button"
            key={button.type}
            onClick={() => handleButtonClick(button)}
            disabled={isCreating}
            style={{
              background: selectedTool === button.type ? '#eef2ff' : 'transparent',
              border: 'none',
              borderRadius: '8px',
              padding: '10px',
              cursor: isCreating ? 'not-allowed' : 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
              opacity: isCreating ? 0.5 : 1,
              position: 'relative',
            }}
            onMouseEnter={(e) => {
              if (!isCreating && selectedTool !== button.type) {
                e.currentTarget.style.background = '#f9fafb';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedTool !== button.type) {
                e.currentTarget.style.background = 'transparent';
              }
            }}
            title={`${button.label}${button.shortcut ? ` (${button.shortcut})` : ''}`}
          >
            <div style={{ color: '#6b7280' }}>{button.icon}</div>
            <span style={{ fontSize: '13px', color: '#374151', fontWeight: '500' }}>
              {button.label}
            </span>
            {button.shortcut && (
              <span
                style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  fontSize: '11px',
                  color: '#6b7280',
                  background: 'rgba(255, 255, 255, 0.9)',
                  padding: '2px 4px',
                  borderRadius: '3px',
                  fontWeight: '500',
                }}
              >
                {button.shortcut}
              </span>
            )}
          </button>
        ))}

        <div
          style={{
            width: '100%',
            height: '1px',
            background: '#e5e7eb',
            margin: '4px 0',
          }}
        />

        <div
          style={{
            fontSize: '12px',
            color: '#6b7280',
            textAlign: 'center',
            padding: '4px',
            lineHeight: 1.4,
            fontWeight: '400',
          }}
        >
          Click to add
          <br />
          to canvas
        </div>
      </div>
    </div>
  );
};

export default NativeComponentsToolbar;
