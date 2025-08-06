import React from 'react';
import type { ComponentState } from '../../types/native-component.types.ts';

interface TextCustomizerProps {
  state: ComponentState;
  onUpdateState: (newState: ComponentState) => void;
  onClose: () => void;
}

const TextCustomizer: React.FC<TextCustomizerProps> = ({ state, onUpdateState, onClose }) => {
  const fontFamilies = [
    { name: 'Sans Serif', value: 'Inter, system-ui, sans-serif' },
    { name: 'Serif', value: 'Georgia, serif' },
    { name: 'Mono', value: 'Consolas, Monaco, monospace' },
    { name: 'Display', value: '"Playfair Display", serif' },
    { name: 'Handwriting', value: '"Caveat", cursive' },
  ];

  const fontWeights = [
    { name: 'Light', value: '300' },
    { name: 'Regular', value: '400' },
    { name: 'Medium', value: '500' },
    { name: 'Semibold', value: '600' },
    { name: 'Bold', value: '700' },
  ];

  const textAlignments = [
    { name: 'Left', value: 'left', icon: 'M3 3h18M3 8h10M3 13h18M3 18h15' },
    { name: 'Center', value: 'center', icon: 'M3 3h18M6 8h12M3 13h18M5 18h14' },
    { name: 'Right', value: 'right', icon: 'M3 3h18M11 8h10M3 13h18M6 18h15' },
  ];

  const textColors = [
    { name: 'Black', value: '#111827' },
    { name: 'Gray', value: '#6b7280' },
    { name: 'Red', value: '#dc2626' },
    { name: 'Orange', value: '#ea580c' },
    { name: 'Yellow', value: '#ca8a04' },
    { name: 'Green', value: '#16a34a' },
    { name: 'Blue', value: '#2563eb' },
    { name: 'Purple', value: '#7c3aed' },
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
        minWidth: '280px',
        maxWidth: '320px',
        zIndex: 1000,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#111827' }}>Text Formatting</h4>
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
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18" />
            <path d="M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Font Size */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px', display: 'block' }}>
          Font Size
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="range"
            min="12"
            max="72"
            step="2"
            value={state.fontSize || 16}
            onChange={(e) => onUpdateState({ ...state, fontSize: parseInt(e.target.value) })}
            style={{ flex: 1 }}
          />
          <div style={{
            minWidth: '45px',
            padding: '4px 8px',
            background: '#f3f4f6',
            borderRadius: '4px',
            fontSize: '12px',
            textAlign: 'center',
            fontWeight: '500',
          }}>
            {state.fontSize || 16}px
          </div>
        </div>
      </div>

      {/* Font Family */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px', display: 'block' }}>
          Font Family
        </label>
        <select
          value={state.fontFamily || fontFamilies[0].value}
          onChange={(e) => onUpdateState({ ...state, fontFamily: e.target.value })}
          style={{
            width: '100%',
            padding: '6px 8px',
            border: '1px solid #e5e7eb',
            borderRadius: '4px',
            fontSize: '13px',
            cursor: 'pointer',
            background: 'white',
          }}
        >
          {fontFamilies.map((font) => (
            <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
              {font.name}
            </option>
          ))}
        </select>
      </div>

      {/* Font Weight */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px', display: 'block' }}>
          Font Weight
        </label>
        <div style={{ display: 'flex', gap: '4px' }}>
          {fontWeights.map((weight) => (
            <button
              key={weight.value}
              onClick={() => onUpdateState({ ...state, fontWeight: weight.value })}
              style={{
                flex: 1,
                padding: '6px',
                border: `1px solid ${state.fontWeight === weight.value ? '#6366f1' : '#e5e7eb'}`,
                borderRadius: '4px',
                background: state.fontWeight === weight.value ? '#eef2ff' : 'white',
                color: state.fontWeight === weight.value ? '#6366f1' : '#6b7280',
                fontSize: '11px',
                cursor: 'pointer',
                fontWeight: weight.value,
              }}
            >
              {weight.name}
            </button>
          ))}
        </div>
      </div>

      {/* Text Alignment */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px', display: 'block' }}>
          Text Alignment
        </label>
        <div style={{ display: 'flex', gap: '4px' }}>
          {textAlignments.map((align) => (
            <button
              key={align.value}
              onClick={() => onUpdateState({ ...state, textAlign: align.value as 'left' | 'center' | 'right' })}
              style={{
                flex: 1,
                padding: '8px',
                border: `1px solid ${state.textAlign === align.value ? '#6366f1' : '#e5e7eb'}`,
                borderRadius: '4px',
                background: state.textAlign === align.value ? '#eef2ff' : 'white',
                color: state.textAlign === align.value ? '#6366f1' : '#6b7280',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title={align.name}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d={align.icon} />
              </svg>
            </button>
          ))}
        </div>
      </div>

      {/* Text Color */}
      <div style={{ marginBottom: '8px' }}>
        <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px', display: 'block' }}>
          Text Color
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', marginBottom: '8px' }}>
          {textColors.map((color) => (
            <button
              key={color.value}
              onClick={() => onUpdateState({ ...state, textColor: color.value })}
              style={{
                width: '100%',
                height: '32px',
                background: color.value,
                border: `2px solid ${state.textColor === color.value ? '#6366f1' : '#e5e7eb'}`,
                borderRadius: '4px',
                cursor: 'pointer',
                position: 'relative',
              }}
              title={color.name}
            >
              {state.textColor === color.value && (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={color.value === '#111827' ? 'white' : '#6366f1'}
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
    </div>
  );
};

export default TextCustomizer;