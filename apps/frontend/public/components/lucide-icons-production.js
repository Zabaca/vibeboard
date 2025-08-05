// Production-style component with top-level CDN import
import * as LucideIcons from 'https://esm.sh/lucide-react@0.294.0?external=react';
import React, { useState } from 'react';

const LucideIconsProduction = () => {
  const [selectedIcon, setSelectedIcon] = useState('Home');
  const [size, setSize] = useState(48);
  const [color, setColor] = useState('#3b82f6');

  // Get available icon names (first 50 for demo)
  const iconNames = Object.keys(LucideIcons)
    .filter(key => key[0] === key[0].toUpperCase() && !key.includes('Icon'))
    .slice(0, 50);

  const IconComponent = LucideIcons[selectedIcon];

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
    }, '🚀 Production Style: Top-Level Import'),
    
    React.createElement('div', {
      style: {
        padding: '16px',
        backgroundColor: '#f0f9ff',
        borderRadius: '8px',
        marginBottom: '20px',
        fontSize: '14px',
        color: '#0369a1'
      }
    }, 
      React.createElement('strong', null, 'Note: '),
      'This version uses a top-level import. Icons are available immediately, no loading state needed!'
    ),
    
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
        strokeWidth: 2
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
    
    // Icon grid - simpler without loading states
    React.createElement('div', {
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
        gap: '8px',
        padding: '16px',
        backgroundColor: '#f1f5f9',
        borderRadius: '8px',
        maxHeight: '300px',
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
            transition: 'all 0.2s'
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
              color: selectedIcon === iconName ? '#0284c7' : '#94a3b8'
            }
          }, iconName)
        );
      })
    ),
    
    // Comparison info
    React.createElement('div', {
      style: {
        marginTop: '20px',
        padding: '12px',
        backgroundColor: '#f3f4f6',
        borderRadius: '6px',
        fontSize: '12px',
        color: '#4b5563'
      }
    }, 
      React.createElement('h4', {
        style: { marginBottom: '8px', fontWeight: '600' }
      }, 'Top-Level Import Benefits:'),
      React.createElement('ul', {
        style: { marginLeft: '20px', lineHeight: '1.6' }
      },
        React.createElement('li', null, 'Simpler code - no useEffect needed'),
        React.createElement('li', null, 'Icons available immediately on render'),
        React.createElement('li', null, 'Better TypeScript support (if using TS)'),
        React.createElement('li', null, 'Module loaded once at parse time'),
        React.createElement('li', null, 'Better for production applications')
      )
    )
  );
};

export default LucideIconsProduction;