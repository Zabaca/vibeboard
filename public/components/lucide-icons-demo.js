// ESM React component using Lucide React icons from CDN
import React, { useState } from 'react';
import * as LucideIcons from 'https://esm.sh/lucide-react@0.294.0?external=react';

const LucideIconsDemo = () => {
  const [selectedIcon, setSelectedIcon] = useState('Home');
  const [size, setSize] = useState(48);
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [color, setColor] = useState('#3b82f6');

  // Get available icon names (first 50 for demo)
  const iconNames = Object.keys(LucideIcons)
    .filter(key => key[0] === key[0].toUpperCase() && !key.includes('Icon'))
    .slice(0, 50);

  const IconComponent = LucideIcons?.[selectedIcon];

  return React.createElement('div', {
    style: {
      padding: '24px',
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      maxWidth: '900px',
      margin: '0 auto'
    }
  },
    React.createElement('h3', {
      style: {
        marginBottom: '20px',
        color: '#1e293b',
        fontSize: '20px',
        fontWeight: '600',
        textAlign: 'center'
      }
    }, '🎨 Lucide React Icons from NPM (via esm.sh)'),
    
    // Controls
    React.createElement('div', {
      style: {
        display: 'flex',
        gap: '16px',
        marginBottom: '24px',
        justifyContent: 'center',
        alignItems: 'center',
        flexWrap: 'wrap'
      }
    },
      // Color picker
      React.createElement('div', {
        style: { display: 'flex', alignItems: 'center', gap: '8px' }
      },
        React.createElement('label', {
          style: { fontSize: '14px', color: '#475569' }
        }, 'Color:'),
        React.createElement('input', {
          type: 'color',
          value: color,
          onChange: (e) => setColor(e.target.value),
          style: {
            width: '40px',
            height: '32px',
            border: '2px solid #e2e8f0',
            borderRadius: '4px',
            cursor: 'pointer'
          }
        })
      ),
      
      // Size slider
      React.createElement('div', {
        style: { display: 'flex', alignItems: 'center', gap: '8px' }
      },
        React.createElement('label', {
          style: { fontSize: '14px', color: '#475569' }
        }, `Size: ${size}px`),
        React.createElement('input', {
          type: 'range',
          min: '16',
          max: '96',
          value: size,
          onChange: (e) => setSize(parseInt(e.target.value)),
          style: { width: '100px' }
        })
      ),
      
      // Stroke width
      React.createElement('div', {
        style: { display: 'flex', alignItems: 'center', gap: '8px' }
      },
        React.createElement('label', {
          style: { fontSize: '14px', color: '#475569' }
        }, `Stroke: ${strokeWidth}`),
        React.createElement('input', {
          type: 'range',
          min: '1',
          max: '3',
          step: '0.5',
          value: strokeWidth,
          onChange: (e) => setStrokeWidth(parseFloat(e.target.value)),
          style: { width: '100px' }
        })
      )
    ),
    
    // Selected icon display
    React.createElement('div', {
      style: {
        padding: '32px',
        backgroundColor: '#f8fafc',
        borderRadius: '8px',
        textAlign: 'center',
        marginBottom: '24px'
      }
    },
      IconComponent ? React.createElement(IconComponent, {
        size: size,
        color: color,
        strokeWidth: strokeWidth
      }) : React.createElement('div', null, 'Select an icon'),
      React.createElement('div', {
        style: {
          marginTop: '16px',
          fontSize: '16px',
          color: '#475569',
          fontWeight: '500'
        }
      }, selectedIcon)
    ),
    
    // Icon grid
    React.createElement('div', {
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
        gap: '8px',
        padding: '16px',
        backgroundColor: '#f1f5f9',
        borderRadius: '8px',
        maxHeight: '400px',
        overflowY: 'auto'
      }
    },
      iconNames.map(iconName => {
        const Icon = LucideIcons[iconName];
        return React.createElement('button', {
          key: iconName,
          onClick: () => setSelectedIcon(iconName),
          style: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px 8px',
            backgroundColor: selectedIcon === iconName ? '#e0f2fe' : 'white',
            border: selectedIcon === iconName ? '2px solid #0ea5e9' : '2px solid transparent',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            minHeight: '70px'
          },
          onMouseEnter: (e) => {
            if (selectedIcon !== iconName) {
              e.currentTarget.style.backgroundColor = '#f0f9ff';
            }
          },
          onMouseLeave: (e) => {
            if (selectedIcon !== iconName) {
              e.currentTarget.style.backgroundColor = 'white';
            }
          }
        },
          React.createElement(Icon, {
            size: 24,
            color: selectedIcon === iconName ? '#0284c7' : '#64748b',
            strokeWidth: 2
          }),
          React.createElement('span', {
            style: {
              marginTop: '4px',
              fontSize: '10px',
              color: selectedIcon === iconName ? '#0284c7' : '#94a3b8',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              width: '100%'
            }
          }, iconName)
        );
      })
    ),
    
    // Info box
    React.createElement('div', {
      style: {
        marginTop: '20px',
        padding: '12px',
        backgroundColor: '#e0f2fe',
        borderRadius: '6px',
        fontSize: '13px',
        color: '#075985',
        textAlign: 'center'
      }
    }, 
      React.createElement('div', null, `✅ Successfully loaded ${iconNames.length}+ icons from lucide-react`),
      React.createElement('div', {
        style: { marginTop: '4px', fontSize: '12px', opacity: 0.8 }
      }, 'Published NPM package loaded via esm.sh CDN'),
      React.createElement('div', {
        style: { marginTop: '4px', fontSize: '11px', opacity: 0.6 }
      }, 'Using ?external=react to avoid React bundling')
    )
  );
};

export default LucideIconsDemo;