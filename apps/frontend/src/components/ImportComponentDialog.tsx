import React, { useState, useRef, useEffect } from 'react';

interface ImportComponentDialogProps {
  isOpen: boolean;
  onImport: (code: string, description?: string) => void;
  onCancel: () => void;
  isProcessing?: boolean;
}

const ImportComponentDialog: React.FC<ImportComponentDialogProps> = ({
  isOpen,
  onImport,
  onCancel,
  isProcessing = false,
}) => {
  const [componentCode, setComponentCode] = useState('');
  const [description, setDescription] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      // Reset form when dialog opens
      setComponentCode('');
      setDescription('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (componentCode.trim()) {
      onImport(componentCode.trim(), description.trim() || undefined);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  const isValidCode = componentCode.trim().length > 0;

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
        onClick={onCancel}
      >
        {/* Dialog */}
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '24px',
            width: '90%',
            maxWidth: '700px',
            maxHeight: '85vh',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            animation: 'slideIn 0.2s ease-out',
            display: 'flex',
            flexDirection: 'column',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{
              margin: '0 0 8px 0',
              fontSize: '24px',
              fontWeight: '600',
              color: '#1f2937',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              📥 Import Component
            </h2>
            <p style={{
              margin: 0,
              fontSize: '14px',
              color: '#6b7280',
              lineHeight: '1.5',
            }}>
              Paste your React component code below. It will be processed through the same pipeline as AI-generated components.
            </p>
          </div>

          {/* Description Input */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontSize: '13px',
              fontWeight: '500',
              color: '#374151',
            }}>
              Component Description (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isProcessing}
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '14px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                outline: 'none',
                transition: 'border-color 0.2s',
                backgroundColor: isProcessing ? '#f9fafb' : 'white',
                cursor: isProcessing ? 'not-allowed' : 'text',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#6366f1';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb';
              }}
              placeholder="Brief description of the component..."
            />
          </div>

          {/* Code Editor */}
          <div style={{ flex: 1, marginBottom: '20px', minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '13px',
              fontWeight: '500',
              color: '#374151',
            }}>
              Component Code
            </label>
            <textarea
              ref={textareaRef}
              value={componentCode}
              onChange={(e) => setComponentCode(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isProcessing}
              style={{
                flex: 1,
                width: '100%',
                minHeight: '300px',
                padding: '16px',
                fontSize: '13px',
                lineHeight: '1.6',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                resize: 'none',
                fontFamily: '"JetBrains Mono", "SF Mono", Monaco, Inconsolata, "Roboto Mono", "Droid Sans Mono", "Liberation Mono", Menlo, Courier, monospace',
                outline: 'none',
                transition: 'border-color 0.2s',
                backgroundColor: isProcessing ? '#f9fafb' : 'white',
                cursor: isProcessing ? 'not-allowed' : 'text',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#6366f1';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb';
              }}
              placeholder={`import React, { useState } from 'react';

export default function MyComponent() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <h1>Count: {count}</h1>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}`}
            />
            <div style={{
              marginTop: '8px',
              fontSize: '12px',
              color: '#9ca3af',
            }}>
              💡 Tip: Press Ctrl+Enter (or Cmd+Enter) to import • ESM/JSX/TSX formats supported
            </div>
          </div>

          {/* Example Formats */}
          <details style={{ marginBottom: '20px' }}>
            <summary style={{
              cursor: 'pointer',
              fontSize: '13px',
              color: '#6366f1',
              fontWeight: '500',
              userSelect: 'none',
              padding: '4px 0',
            }}>
              Supported formats & examples
            </summary>
            <div style={{
              marginTop: '8px',
              padding: '12px',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              fontSize: '12px',
              lineHeight: '1.6',
              color: '#4b5563',
            }}>
              <div><strong>✅ Supported:</strong></div>
              <div>• React functional components (with hooks)</div>
              <div>• JSX/TSX syntax</div>
              <div>• ES modules (import/export)</div>
              <div>• Components with external dependencies (will attempt CDN resolution)</div>
              <div><br/><strong>⚠️ Note:</strong></div>
              <div>• Component will be processed and transpiled automatically</div>
              <div>• Missing React imports will be added automatically</div>
              <div>• External dependencies will be resolved via CDN when possible</div>
            </div>
          </details>

          {/* Actions */}
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end',
          }}>
            <button
              onClick={onCancel}
              disabled={isProcessing}
              style={{
                padding: '12px 20px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                backgroundColor: 'white',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                opacity: isProcessing ? 0.5 : 1,
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (!isProcessing) {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isProcessing || !isValidCode}
              style={{
                padding: '12px 20px',
                fontSize: '14px',
                fontWeight: '500',
                color: 'white',
                backgroundColor: isProcessing ? '#9ca3af' : (isValidCode ? '#6366f1' : '#d1d5db'),
                border: 'none',
                borderRadius: '8px',
                cursor: isProcessing || !isValidCode ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (!isProcessing && isValidCode) {
                  e.currentTarget.style.backgroundColor = '#5558e3';
                }
              }}
              onMouseLeave={(e) => {
                if (!isProcessing && isValidCode) {
                  e.currentTarget.style.backgroundColor = '#6366f1';
                }
              }}
            >
              {isProcessing ? (
                <>
                  <span style={{
                    display: 'inline-block',
                    animation: 'spin 1s linear infinite',
                  }}>⏳</span>
                  Processing...
                </>
              ) : (
                <>
                  📥 Import Component
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Animation styles */}
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </>
  );
};

export default ImportComponentDialog;