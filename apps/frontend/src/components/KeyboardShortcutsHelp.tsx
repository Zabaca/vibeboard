import React from 'react';

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutSection {
  title: string;
  shortcuts: Array<{
    keys: string[];
    description: string;
    icon?: string;
  }>;
}

const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = ({ isOpen, onClose }) => {
  // Handle escape key
  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shortcutSections: ShortcutSection[] = [
    {
      title: 'Clipboard & Paste',
      shortcuts: [
        {
          keys: ['Ctrl', 'V'],
          description: 'Paste images or text from clipboard',
          icon: '📋',
        },
        {
          keys: ['Click canvas first'],
          description: 'Focus canvas to enable paste functionality',
          icon: '👆',
        },
      ],
    },
    {
      title: 'Component Management',
      shortcuts: [
        {
          keys: ['Ctrl', 'Shift', 'P'],
          description: 'Import component from code',
          icon: '📥',
        },
        {
          keys: ['Ctrl', 'Shift', 'I'],
          description: 'Import component from URL (Dev mode)',
          icon: '🔗',
        },
      ],
    },
    {
      title: 'Native Components (Single Keys)',
      shortcuts: [
        {
          keys: ['T'],
          description: 'Add text component',
          icon: '📝',
        },
        {
          keys: ['R'],
          description: 'Add rectangle shape',
          icon: '🟦',
        },
        {
          keys: ['C'],
          description: 'Add triangle shape',
          icon: '🔺',
        },
        {
          keys: ['S'],
          description: 'Add sticky note',
          icon: '📝',
        },
      ],
    },
    {
      title: 'Canvas Controls',
      shortcuts: [
        {
          keys: ['Drag header'],
          description: 'Move components around',
          icon: '👆',
        },
        {
          keys: ['Click + Drag'],
          description: 'Pan around canvas',
          icon: '🖱️',
        },
        {
          keys: ['Mouse wheel'],
          description: 'Zoom in/out',
          icon: '🔍',
        },
      ],
    },
  ];

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(4px)',
      }}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
      aria-describedby="shortcuts-description"
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '24px',
          maxWidth: '600px',
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
          margin: '20px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
            paddingBottom: '16px',
            borderBottom: '1px solid #e5e7eb',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                backgroundColor: '#6366f1',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
              }}
            >
              ⌨️
            </div>
            <div>
              <h2
                id="shortcuts-title"
                style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#111827' }}
              >
                Keyboard Shortcuts
              </h2>
              <p
                id="shortcuts-description"
                style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}
              >
                Speed up your workflow with these shortcuts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              color: '#9ca3af',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
              e.currentTarget.style.color = '#374151';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#9ca3af';
            }}
            aria-label="Close keyboard shortcuts dialog"
            title="Close (Escape)"
          >
            ×
          </button>
        </div>

        {/* Shortcut Sections */}
        <div style={{ display: 'grid', gap: '24px' }}>
          {shortcutSections.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              <h3
                style={{
                  margin: '0 0 12px 0',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#374151',
                }}
              >
                {section.title}
              </h3>
              <div style={{ display: 'grid', gap: '8px' }}>
                {section.shortcuts.map((shortcut, shortcutIndex) => (
                  <div
                    key={shortcutIndex}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {shortcut.icon && <span style={{ fontSize: '18px' }}>{shortcut.icon}</span>}
                      <span style={{ fontSize: '14px', color: '#374151' }}>
                        {shortcut.description}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {shortcut.keys.map((key, keyIndex) => (
                        <React.Fragment key={keyIndex}>
                          {keyIndex > 0 && (
                            <span style={{ fontSize: '12px', color: '#9ca3af', margin: '0 2px' }}>
                              +
                            </span>
                          )}
                          <kbd
                            style={{
                              padding: '4px 8px',
                              backgroundColor: 'white',
                              border: '1px solid #d1d5db',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontFamily: 'monospace',
                              color: '#374151',
                              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                              minWidth: key.length > 3 ? 'auto' : '24px',
                              textAlign: 'center',
                            }}
                          >
                            {key}
                          </kbd>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: '24px',
            paddingTop: '16px',
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: '12px',
              color: '#9ca3af',
              textAlign: 'center',
            }}
          >
            💡 Tip: Click on the canvas first to enable paste functionality
          </p>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsHelp;
