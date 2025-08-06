import React, { useState, useEffect, useRef } from 'react';
import CodeEditor from './CodeEditor.tsx';

interface CodeEditDialogProps {
  isOpen: boolean;
  code: string;
  prompt: string;
  nodeId?: string;
  onSave: (newCode: string) => void;
  onRegenerate: (newPrompt: string) => void;
  onCancel: () => void;
  isGenerating?: boolean;
  getNodeCode?: (nodeId: string) => string;
}

const CodeEditDialog: React.FC<CodeEditDialogProps> = ({
  isOpen,
  code,
  prompt,
  nodeId,
  onSave,
  onRegenerate,
  onCancel,
  isGenerating = false,
  getNodeCode,
}) => {
  const [editedPrompt, setEditedPrompt] = useState(prompt);
  const [editedCode, setEditedCode] = useState(code);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [topHeight, setTopHeight] = useState(25); // percentage
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setEditedPrompt(prompt);
    // If we have a nodeId and getNodeCode function, fetch the code
    if (nodeId && getNodeCode && isOpen) {
      const nodeCode = getNodeCode(nodeId);
      setEditedCode(nodeCode);
    } else {
      setEditedCode(code);
    }
  }, [prompt, code, nodeId, getNodeCode, isOpen]);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(editedCode);
      setCopyFeedback('Copied!');
      setTimeout(() => setCopyFeedback(null), 2000);
    } catch {
      setCopyFeedback('Failed');
      setTimeout(() => setCopyFeedback(null), 2000);
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing || !containerRef.current) return;
    
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const percentage = (y / rect.height) * 100;
    
    // Limit the resize between 10% and 70%
    const newHeight = Math.min(Math.max(percentage, 10), 70);
    setTopHeight(newHeight);
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(8px)',
    }}>
      <div 
        ref={containerRef}
        style={{
          backgroundColor: '#1a1a1a',
          borderRadius: '16px',
          width: '90%',
          maxWidth: '1200px',
          height: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '24px 32px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'linear-gradient(to bottom, #2a2a2a, #1a1a1a)',
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '28px',
            fontWeight: '600',
            color: '#ffffff',
            letterSpacing: '-0.5px',
          }}>
            Edit Component
          </h2>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 32px',
          gap: '0',
          minHeight: 0,
          position: 'relative',
        }}>
          {/* Prompt Section */}
          <div style={{ 
            height: `${topHeight}%`,
            display: 'flex',
            flexDirection: 'column',
            marginBottom: '8px',
          }}>
            <label style={{
              display: 'block',
              marginBottom: '12px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#e5e5e5',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              Prompt
            </label>
            <textarea
              value={editedPrompt}
              onChange={(e) => setEditedPrompt(e.target.value)}
              style={{
                flex: 1,
                width: '100%',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backgroundColor: '#0d0d0d',
                color: '#e5e5e5',
                fontSize: '14px',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                resize: 'none',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.5)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              }}
              placeholder="Describe the component you want..."
            />
          </div>

          {/* Resize Handle */}
          <div
            style={{
              height: '4px',
              backgroundColor: isResizing ? '#6366f1' : 'transparent',
              cursor: 'ns-resize',
              position: 'relative',
              margin: '8px 0',
              borderRadius: '2px',
              transition: 'background-color 0.2s',
            }}
            onMouseDown={() => setIsResizing(true)}
            onMouseEnter={(e) => {
              if (!isResizing) {
                e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isResizing) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '40px',
              height: '4px',
              backgroundColor: isResizing ? '#6366f1' : 'rgba(255, 255, 255, 0.2)',
              borderRadius: '2px',
              transition: 'background-color 0.2s',
            }} />
          </div>

          {/* Code Section */}
          <div style={{ 
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
            }}>
              <label style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#e5e5e5',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                Code
              </label>
              <button
                onClick={handleCopyCode}
                style={{
                  background: copyFeedback ? '#10b981' : '#2a2a2a',
                  color: copyFeedback ? 'white' : '#e5e5e5',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (!copyFeedback) {
                    e.currentTarget.style.backgroundColor = '#3a3a3a';
                    e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!copyFeedback) {
                    e.currentTarget.style.backgroundColor = '#2a2a2a';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  }
                }}
              >
                {copyFeedback ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    {copyFeedback}
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    Copy Code
                  </>
                )}
              </button>
            </div>
            <div style={{
              flex: 1,
              minHeight: 0,
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              overflow: 'hidden',
            }}>
              <CodeEditor
                value={editedCode}
                onChange={setEditedCode}
                placeholder="// Enter your component code here..."
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '24px 32px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'linear-gradient(to top, #2a2a2a, #1a1a1a)',
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end',
        }}>
          <button
            onClick={onCancel}
            disabled={isGenerating}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backgroundColor: 'transparent',
              color: '#e5e5e5',
              fontSize: '14px',
              fontWeight: '500',
              cursor: isGenerating ? 'not-allowed' : 'pointer',
              opacity: isGenerating ? 0.5 : 1,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (!isGenerating) {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(editedCode)}
            disabled={isGenerating || !editedCode.trim()}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backgroundColor: 'transparent',
              color: '#e5e5e5',
              fontSize: '14px',
              fontWeight: '500',
              cursor: isGenerating || !editedCode.trim() ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (!isGenerating && editedCode.trim()) {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
            Save Code
          </button>
          <button
            onClick={() => onRegenerate(editedPrompt)}
            disabled={isGenerating || !editedPrompt.trim()}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: isGenerating ? '#4a4a4a' : '#6366f1',
              color: 'white',
              fontSize: '14px',
              fontWeight: '500',
              cursor: isGenerating || !editedPrompt.trim() ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (!isGenerating && editedPrompt.trim()) {
                e.currentTarget.style.backgroundColor = '#5558e3';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isGenerating) {
                e.currentTarget.style.backgroundColor = '#6366f1';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }
            }}
          >
            {isGenerating ? (
              <>
                <span style={{
                  display: 'inline-block',
                  animation: 'spin 1s linear infinite',
                }}>⚡</span>
                Regenerating...
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 4v6h-6" />
                  <path d="M1 20v-6h6" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
                Regenerate
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CodeEditDialog;