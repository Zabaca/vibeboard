// ESM React component using react-icons from CDN
import React, { useState } from 'react';
import * as FaIcons from 'https://esm.sh/react-icons@5.0.1/fa';
import * as MdIcons from 'https://esm.sh/react-icons@5.0.1/md';
import * as AiIcons from 'https://esm.sh/react-icons@5.0.1/ai';
import * as BiIcons from 'https://esm.sh/react-icons@5.0.1/bi';

const ReactIconsDemo = () => {
  const [iconSet, setIconSet] = useState('fa'); // fa, md, ai, bi
  const [iconSize, setIconSize] = useState(32);
  const [iconColor, setIconColor] = useState('#3b82f6');
  
  // Select the current icon set
  const iconSets = {
    fa: FaIcons,
    md: MdIcons,
    ai: AiIcons,
    bi: BiIcons
  };
  
  const currentIcons = iconSets[iconSet];
  
  // Get first 12 icon components from the selected set
  const iconNames = Object.keys(currentIcons).slice(0, 12);
  
  return React.createElement('div', {
    style: {
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      maxWidth: '800px',
      margin: '0 auto'
    }
  },
    React.createElement('h2', {
      style: {
        marginBottom: '20px',
        color: '#1f2937',
        textAlign: 'center'
      }
    }, '🎨 React Icons Demo'),
    
    React.createElement('p', {
      style: {
        marginBottom: '20px',
        color: '#6b7280',
        textAlign: 'center'
      }
    }, 'Loading icon libraries from react-icons NPM package via esm.sh CDN'),
    
    // Icon set selector
    React.createElement('div', {
      style: {
        marginBottom: '20px',
        display: 'flex',
        gap: '10px',
        justifyContent: 'center',
        flexWrap: 'wrap'
      }
    },
      ['fa', 'md', 'ai', 'bi'].map(set => 
        React.createElement('button', {
          key: set,
          onClick: () => setIconSet(set),
          style: {
            padding: '8px 16px',
            backgroundColor: iconSet === set ? '#3b82f6' : '#e5e7eb',
            color: iconSet === set ? 'white' : '#374151',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            transition: 'all 0.2s'
          }
        }, `${set} Icons`)
      )
    ),
    
    // Controls
    React.createElement('div', {
      style: {
        marginBottom: '20px',
        display: 'flex',
        gap: '20px',
        justifyContent: 'center',
        alignItems: 'center',
        flexWrap: 'wrap'
      }
    },
      React.createElement('div', {
        style: { display: 'flex', alignItems: 'center', gap: '8px' }
      },
        React.createElement('label', {
          style: { fontSize: '14px', color: '#6b7280' }
        }, 'Size:'),
        React.createElement('input', {
          type: 'range',
          min: '16',
          max: '64',
          value: iconSize,
          onChange: (e) => setIconSize(parseInt(e.target.value)),
          style: { width: '100px' }
        }),
        React.createElement('span', {
          style: { fontSize: '14px', color: '#6b7280', minWidth: '40px' }
        }, `${iconSize}px`)
      ),
      React.createElement('div', {
        style: { display: 'flex', alignItems: 'center', gap: '8px' }
      },
        React.createElement('label', {
          style: { fontSize: '14px', color: '#6b7280' }
        }, 'Color:'),
        React.createElement('input', {
          type: 'color',
          value: iconColor,
          onChange: (e) => setIconColor(e.target.value),
          style: {
            width: '50px',
            height: '30px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            cursor: 'pointer'
          }
        })
      )
    ),
    
    // Icon grid
    React.createElement('div', {
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
        gap: '20px',
        padding: '20px',
        backgroundColor: '#f9fafb',
        borderRadius: '8px',
        minHeight: '200px'
      }
    },
      iconNames.map(iconName => {
        const IconComponent = currentIcons[iconName];
        if (typeof IconComponent !== 'function') return null;
        
        return React.createElement('div', {
          key: iconName,
          style: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            padding: '12px',
            backgroundColor: 'white',
            borderRadius: '6px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            transition: 'transform 0.2s',
            cursor: 'pointer'
          },
          onMouseEnter: (e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
          },
          onMouseLeave: (e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }
        },
          React.createElement(IconComponent, {
            size: iconSize,
            color: iconColor
          }),
          React.createElement('span', {
            style: {
              fontSize: '11px',
              color: '#6b7280',
              textAlign: 'center',
              wordBreak: 'break-all'
            }
          }, iconName.substring(2)) // Remove prefix (Fa, Md, Ai, Bi)
        );
      })
    ),
    
    // Info
    React.createElement('div', {
      style: {
        marginTop: '20px',
        padding: '15px',
        backgroundColor: '#dbeafe',
        borderRadius: '8px',
        fontSize: '14px',
        color: '#1e40af',
        textAlign: 'center'
      }
    },
      React.createElement('strong', null, '✅ Multiple icon libraries loaded from react-icons!'),
      React.createElement('br'),
      React.createElement('small', null, 'Font Awesome, Material Design, Ant Design, Bootstrap Icons'),
      React.createElement('br'),
      React.createElement('small', {
        style: { fontSize: '12px', opacity: 0.8 }
      }, 'All loaded via top-level imports from esm.sh CDN')
    )
  );
};

export default ReactIconsDemo;