import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import CodeEditor from './CodeEditor.tsx';
// import { PerformanceDebugger } from '../utils/performance-debug.ts';
import { useWhyDidYouUpdate } from '../hooks/useWhyDidYouUpdate.ts';
import { codeEditDialogStyles } from './CodeEditDialog.styles.ts';

interface CodeEditDialogProps {
  isOpen: boolean;
  code: string;
  prompt: string;
  nodeId?: string;
  onSave: (newCode: string) => void;
  onRegenerate: (refinementPrompt: string, currentCode: string) => void;
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
  const [refinementPrompt, setRefinementPrompt] = useState('');
  const [debouncedRefinementPrompt, setDebouncedRefinementPrompt] = useState('');
  const [editedCode, setEditedCode] = useState(code);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [leftWidth, setLeftWidth] = useState(50); // percentage for columns
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Debug why component is re-rendering
  useWhyDidYouUpdate('CodeEditDialog', {
    isOpen,
    code,
    prompt,
    nodeId,
    onSave,
    onRegenerate,
    onCancel,
    isGenerating,
    getNodeCode
  });
  
  // Debug production performance
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
      console.log('[CodeEditDialog] Render triggered', {
        isOpen,
        codeLength: code.length,
        nodeId,
        timestamp: performance.now()
      });
    }
  }, [isOpen, code.length, nodeId]);

  // Memoize the node code to prevent expensive recalculations
  const nodeCode = useMemo(() => {
    if (nodeId && getNodeCode && isOpen) {
      return getNodeCode(nodeId);
    }
    return code;
  }, [nodeId, getNodeCode, isOpen, code]);

  useEffect(() => {
    // Reset refinement prompt when dialog opens
    setRefinementPrompt('');
    setDebouncedRefinementPrompt('');
    // Set the code from memoized value
    setEditedCode(nodeCode);
  }, [nodeCode, isOpen]);

  // Debounce refinement prompt to prevent excessive re-renders
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedRefinementPrompt(refinementPrompt);
    }, 300);
    return () => clearTimeout(timer);
  }, [refinementPrompt]);

  const handleCopyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(editedCode);
      setCopyFeedback('Copied!');
      setTimeout(() => setCopyFeedback(null), 2000);
    } catch {
      setCopyFeedback('Failed');
      setTimeout(() => setCopyFeedback(null), 2000);
    }
  }, [editedCode]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !contentRef.current) return;
    
    const content = contentRef.current;
    const rect = content.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    
    // Limit the resize between 30% and 70%
    const newWidth = Math.min(Math.max(percentage, 30), 70);
    setLeftWidth(newWidth);
  }, [isResizing]);

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
    <>
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
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

        {/* Content - Two Column Layout */}
        <div 
          ref={contentRef}
          style={{
            flex: 1,
            display: 'flex',
            padding: '24px 32px',
            gap: '0',
            minHeight: 0,
            position: 'relative',
          }}
        >
          {/* Left Column - Code Editor */}
          <div style={{ 
            width: `${leftWidth}%`,
            display: 'flex',
            flexDirection: 'column',
            paddingRight: '12px',
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

          {/* Resize Handle */}
          <div
            style={{
              width: '4px',
              backgroundColor: isResizing ? '#6366f1' : 'transparent',
              cursor: 'ew-resize',
              position: 'relative',
              margin: '0 8px',
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
              width: '4px',
              height: '40px',
              backgroundColor: isResizing ? '#6366f1' : 'rgba(255, 255, 255, 0.2)',
              borderRadius: '2px',
              transition: 'background-color 0.2s',
            }} />
          </div>

          {/* Right Column - Original Prompt and Refinement */}
          <div style={{ 
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            paddingLeft: '12px',
            gap: '24px',
          }}>
            {/* Original Prompt Section */}
            <div style={{ 
              display: 'flex',
              flexDirection: 'column',
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
                Original Prompt
              </label>
              <div style={{
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backgroundColor: '#0d0d0d',
                color: '#e5e5e5',
                fontSize: '14px',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                minHeight: '100px',
                maxHeight: '200px',
                overflowY: 'auto',
              }}>
                {prompt || 'No prompt provided'}
              </div>
            </div>

            {/* Refinement Section */}
            <div style={{ 
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
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
                Request Adjustments
              </label>
              <textarea
                value={refinementPrompt}
                onChange={(e) => setRefinementPrompt(e.target.value)}
                style={codeEditDialogStyles.textarea}
                onFocus={(e) => {
                  Object.assign(e.currentTarget.style, codeEditDialogStyles.textareaFocused);
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                }}
                placeholder="Describe what changes you want to make to the component..."
              />
              <button
                onClick={() => onRegenerate(debouncedRefinementPrompt, editedCode)}
                disabled={isGenerating || !debouncedRefinementPrompt.trim()}
                style={{
                  marginTop: '16px',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: isGenerating ? '#4a4a4a' : '#6366f1',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: isGenerating || !refinementPrompt.trim() ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isGenerating && debouncedRefinementPrompt.trim()) {
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
              border: 'none',
              backgroundColor: '#6366f1',
              color: 'white',
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
                e.currentTarget.style.backgroundColor = '#5558e3';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#6366f1';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
            Save Code
          </button>
        </div>
      </div>
    </div>
    </>
  );
};

export default React.memo(CodeEditDialog, (prevProps, nextProps) => {
  // Only re-render if these specific props change
  return (
    prevProps.isOpen === nextProps.isOpen &&
    prevProps.code === nextProps.code &&
    prevProps.prompt === nextProps.prompt &&
    prevProps.nodeId === nextProps.nodeId &&
    prevProps.isGenerating === nextProps.isGenerating &&
    prevProps.getNodeCode === nextProps.getNodeCode
  );
});