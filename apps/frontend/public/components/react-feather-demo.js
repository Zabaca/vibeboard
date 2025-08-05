// ESM React component using React Feather icons from CDN
import React, { useState } from 'react';
import * as FeatherIcons from 'https://esm.sh/react-feather@2.0.10?external=react';

const ReactFeatherDemo = () => {
  const [selectedIcon, setSelectedIcon] = useState('Activity');
  const [size, setSize] = useState(48);
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [color, setColor] = useState('#6366f1');
  const [fill, setFill] = useState('none');

  // Get available icon names
  const iconNames = [
    'Activity', 'Airplay', 'AlertCircle', 'AlertOctagon', 'AlertTriangle',
    'Archive', 'Award', 'BarChart', 'BarChart2', 'Battery',
    'Bell', 'Bluetooth', 'Book', 'Bookmark', 'Box',
    'Briefcase', 'Calendar', 'Camera', 'Cast', 'Check',
    'CheckCircle', 'CheckSquare', 'ChevronDown', 'ChevronLeft', 'ChevronRight',
    'ChevronUp', 'Chrome', 'Circle', 'Clipboard', 'Clock',
    'Cloud', 'Code', 'Coffee', 'Command', 'Compass',
    'Copy', 'Cpu', 'CreditCard', 'Database', 'Delete',
    'Disc', 'Download', 'Droplet', 'Edit', 'Edit2',
    'Eye', 'Facebook', 'FastForward', 'Feather', 'File',
    'Film', 'Filter', 'Flag', 'Folder', 'Gift',
    'GitHub', 'Globe', 'Grid', 'HardDrive', 'Hash',
    'Headphones', 'Heart', 'HelpCircle', 'Home', 'Image',
    'Inbox', 'Info', 'Instagram', 'Key', 'Layers',
    'Layout', 'Link', 'List', 'Lock', 'LogIn',
    'LogOut', 'Mail', 'Map', 'MapPin', 'Menu',
    'MessageCircle', 'MessageSquare', 'Mic', 'Monitor', 'Moon',
    'Music', 'Navigation', 'Package', 'Paperclip', 'Pause',
    'Phone', 'Play', 'Plus', 'Pocket', 'Power',
    'Printer', 'Radio', 'RefreshCw', 'Save', 'Search',
    'Send', 'Server', 'Settings', 'Share', 'Shield',
    'ShoppingCart', 'Shuffle', 'Sidebar', 'Slack', 'Smartphone',
    'Speaker', 'Star', 'Sun', 'Tag', 'Target',
    'Terminal', 'Trash', 'TrendingUp', 'Tv', 'Twitter',
    'Umbrella', 'Unlock', 'Upload', 'User', 'Users',
    'Video', 'Voicemail', 'Volume', 'Watch', 'Wifi',
    'Wind', 'X', 'Youtube', 'Zap', 'ZoomIn'
  ].filter(name => FeatherIcons && FeatherIcons[name]);

  const IconComponent = FeatherIcons?.[selectedIcon];

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
    }, '🪶 React Feather Icons from NPM'),
    
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
        }, 'Stroke:'),
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
      
      // Fill picker
      React.createElement('div', {
        style: { display: 'flex', alignItems: 'center', gap: '8px' }
      },
        React.createElement('label', {
          style: { fontSize: '14px', color: '#475569' }
        }, 'Fill:'),
        React.createElement('button', {
          onClick: () => setFill(fill === 'none' ? color : 'none'),
          style: {
            padding: '6px 12px',
            backgroundColor: fill === 'none' ? '#f8fafc' : color,
            color: fill === 'none' ? '#475569' : 'white',
            border: '2px solid #e2e8f0',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }
        }, fill === 'none' ? 'None' : 'Filled')
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
          min: '0.5',
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
        strokeWidth: strokeWidth,
        fill: fill
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
        gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))',
        gap: '6px',
        padding: '12px',
        backgroundColor: '#f1f5f9',
        borderRadius: '8px',
        maxHeight: '400px',
        overflowY: 'auto'
      }
    },
      iconNames.map(iconName => {
        const Icon = FeatherIcons[iconName];
        if (!Icon) return null;
        return React.createElement('button', {
          key: iconName,
          onClick: () => setSelectedIcon(iconName),
          title: iconName,
          style: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '10px 6px',
            backgroundColor: selectedIcon === iconName ? '#e0f2fe' : 'white',
            border: selectedIcon === iconName ? '2px solid #0ea5e9' : '2px solid transparent',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            minHeight: '60px'
          },
          onMouseEnter: (e) => {
            if (selectedIcon !== iconName) {
              e.currentTarget.style.backgroundColor = '#f0f9ff';
              e.currentTarget.style.transform = 'scale(1.05)';
            }
          },
          onMouseLeave: (e) => {
            if (selectedIcon !== iconName) {
              e.currentTarget.style.backgroundColor = 'white';
              e.currentTarget.style.transform = 'scale(1)';
            }
          }
        },
          React.createElement(Icon, {
            size: 20,
            color: selectedIcon === iconName ? '#0284c7' : '#64748b',
            strokeWidth: 2
          }),
          React.createElement('span', {
            style: {
              marginTop: '2px',
              fontSize: '9px',
              color: selectedIcon === iconName ? '#0284c7' : '#94a3b8',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              width: '100%'
            }
          }, iconName.substring(0, 8))
        );
      })
    ),
    
    // Info box
    React.createElement('div', {
      style: {
        marginTop: '20px',
        padding: '12px',
        backgroundColor: '#dcfce7',
        borderRadius: '6px',
        fontSize: '13px',
        color: '#166534',
        textAlign: 'center'
      }
    }, 
      React.createElement('div', null, `✅ Successfully loaded ${iconNames.length} icons from react-feather@2.0.10`),
      React.createElement('div', {
        style: { marginTop: '4px', fontSize: '12px', opacity: 0.8 }
      }, 'Published NPM package (287+ icons) loaded via esm.sh CDN'),
      React.createElement('div', {
        style: { marginTop: '4px', fontSize: '11px', opacity: 0.6 }
      }, 'Using ?external=react flag to use app\'s React instance')
    )
  );
};

export default ReactFeatherDemo;