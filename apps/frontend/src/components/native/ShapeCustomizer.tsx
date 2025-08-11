import React from 'react';
import type { ComponentState } from '../../types/native-component.types.ts';

interface ShapeCustomizerProps {
  state: ComponentState;
  onUpdateState: (newState: ComponentState) => void;
  onClose: () => void;
}

const ShapeCustomizer: React.FC<ShapeCustomizerProps> = ({ state, onUpdateState, onClose }) => {
  const colors = [
    { name: 'White', value: '#ffffff' },
    { name: 'Gray', value: '#f3f4f6' },
    { name: 'Red', value: '#fee2e2' },
    { name: 'Yellow', value: '#fef3c7' },
    { name: 'Green', value: '#d1fae5' },
    { name: 'Blue', value: '#dbeafe' },
    { name: 'Purple', value: '#e9d5ff' },
    { name: 'Pink', value: '#fce7f3' },
  ];

  const borderColors = [
    { name: 'Indigo', value: '#6366f1' },
    { name: 'Gray', value: '#6b7280' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Yellow', value: '#f59e0b' },
    { name: 'Green', value: '#10b981' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Purple', value: '#8b5cf6' },
    { name: 'Pink', value: '#ec4899' },
  ];

  return (
    <div
      className="nodrag"
      style={{
        position: 'absolute',
        top: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        marginTop: '8px',
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        padding: '12px',
        minWidth: '240px',
        zIndex: 1000,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
        }}
      >
        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#111827' }}>
          Shape Settings
        </h4>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#6b7280',
            cursor: 'pointer',
            padding: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 6L6 18" />
            <path d="M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Shape Type */}
      {state.shapeType !== undefined && (
        <div style={{ marginBottom: '12px' }}>
          <label
            style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', display: 'block' }}
          >
            Shape Type
          </label>
          <div style={{ display: 'flex', gap: '4px' }}>
            {(['rectangle', 'square', 'triangle'] as const).map((shape) => (
              <button
                key={shape}
                onClick={() => onUpdateState({ ...state, shapeType: shape })}
                style={{
                  flex: 1,
                  padding: '6px',
                  border: `1px solid ${state.shapeType === shape ? '#6366f1' : '#e5e7eb'}`,
                  borderRadius: '4px',
                  background: state.shapeType === shape ? '#eef2ff' : 'white',
                  color: state.shapeType === shape ? '#6366f1' : '#6b7280',
                  fontSize: '12px',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {shape}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Fill Color */}
      <div style={{ marginBottom: '12px' }}>
        <label
          style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', display: 'block' }}
        >
          Fill Color
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
          {colors.map((color) => (
            <button
              key={color.value}
              onClick={() => onUpdateState({ ...state, fillColor: color.value })}
              style={{
                width: '100%',
                height: '32px',
                background: color.value,
                border: `2px solid ${state.fillColor === color.value ? '#6366f1' : '#e5e7eb'}`,
                borderRadius: '4px',
                cursor: 'pointer',
                position: 'relative',
              }}
              title={color.name}
            >
              {state.fillColor === color.value && (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="3"
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Border Color */}
      <div style={{ marginBottom: '12px' }}>
        <label
          style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', display: 'block' }}
        >
          Border Color
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
          {borderColors.map((color) => (
            <button
              key={color.value}
              onClick={() => onUpdateState({ ...state, strokeColor: color.value })}
              style={{
                width: '100%',
                height: '32px',
                background: color.value,
                border: `2px solid ${state.strokeColor === color.value ? '#111827' : '#e5e7eb'}`,
                borderRadius: '4px',
                cursor: 'pointer',
                position: 'relative',
              }}
              title={color.name}
            >
              {state.strokeColor === color.value && (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="3"
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Border Width */}
      <div style={{ marginBottom: '12px' }}>
        <label
          style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', display: 'block' }}
        >
          Border Width
        </label>
        <input
          type="range"
          min="0"
          max="8"
          step="1"
          value={state.strokeWidth || 2}
          onChange={(e) => onUpdateState({ ...state, strokeWidth: parseInt(e.target.value) })}
          style={{ width: '100%' }}
        />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '10px',
            color: '#9ca3af',
          }}
        >
          <span>0</span>
          <span>{state.strokeWidth || 2}px</span>
          <span>8</span>
        </div>
      </div>

      {/* Text Settings */}
      {state.text !== undefined && (
        <>
          <div style={{ marginBottom: '12px' }}>
            <label
              style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', display: 'block' }}
            >
              Font Size
            </label>
            <input
              type="range"
              min="12"
              max="48"
              step="2"
              value={state.fontSize || 16}
              onChange={(e) => onUpdateState({ ...state, fontSize: parseInt(e.target.value) })}
              style={{ width: '100%' }}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '10px',
                color: '#9ca3af',
              }}
            >
              <span>12</span>
              <span>{state.fontSize || 16}px</span>
              <span>48</span>
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label
              style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', display: 'block' }}
            >
              Text Color
            </label>
            <input
              type="color"
              value={state.textColor || '#111827'}
              onChange={(e) => onUpdateState({ ...state, textColor: e.target.value })}
              style={{
                width: '100%',
                height: '32px',
                border: '1px solid #e5e7eb',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default ShapeCustomizer;
