import React, { useState, useEffect, useRef } from 'react';

interface PromptEditDialogProps {
  isOpen: boolean;
  prompt: string;
  onConfirm: (newPrompt: string) => void;
  onCancel: () => void;
  isGenerating?: boolean;
}

const PromptEditDialog: React.FC<PromptEditDialogProps> = ({
  isOpen,
  prompt,
  onConfirm,
  onCancel,
  isGenerating = false,
}) => {
  const [editedPrompt, setEditedPrompt] = useState(prompt);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditedPrompt(prompt);
  }, [prompt]);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      onConfirm(editedPrompt);
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

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
            maxWidth: '600px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            animation: 'slideIn 0.2s ease-out',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ marginBottom: '20px' }}>
            <h2
              style={{
                margin: '0 0 8px 0',
                fontSize: '20px',
                fontWeight: '600',
                color: '#1f2937',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              🔄 Regenerate Component
            </h2>
            <p
              style={{
                margin: 0,
                fontSize: '14px',
                color: '#6b7280',
              }}
            >
              Edit the prompt below to regenerate the component with new instructions
            </p>
          </div>

          {/* Prompt Editor */}
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '13px',
                fontWeight: '500',
                color: '#374151',
              }}
            >
              Component Prompt
            </label>
            <textarea
              ref={textareaRef}
              value={editedPrompt}
              onChange={(e) => setEditedPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isGenerating}
              style={{
                width: '100%',
                minHeight: '150px',
                padding: '12px',
                fontSize: '14px',
                lineHeight: '1.5',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                resize: 'vertical',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                outline: 'none',
                transition: 'border-color 0.2s',
                backgroundColor: isGenerating ? '#f9fafb' : 'white',
                cursor: isGenerating ? 'not-allowed' : 'text',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#6366f1';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb';
              }}
              placeholder="Describe the component you want to generate..."
            />
            <div
              style={{
                marginTop: '8px',
                fontSize: '12px',
                color: '#9ca3af',
              }}
            >
              💡 Tip: Press Ctrl+Enter (or Cmd+Enter) to regenerate
            </div>
          </div>

          {/* Example Prompts */}
          <details style={{ marginBottom: '20px' }}>
            <summary
              style={{
                cursor: 'pointer',
                fontSize: '13px',
                color: '#6366f1',
                fontWeight: '500',
                userSelect: 'none',
                padding: '4px 0',
              }}
            >
              Example improvements
            </summary>
            <div
              style={{
                marginTop: '8px',
                padding: '12px',
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                fontSize: '12px',
                lineHeight: '1.6',
                color: '#4b5563',
              }}
            >
              <div>• Add more interactive features</div>
              <div>• Change the color scheme to dark mode</div>
              <div>• Make it responsive for mobile</div>
              <div>• Add animations and transitions</div>
              <div>• Include error handling</div>
              <div>• Add sample data or mock content</div>
            </div>
          </details>

          {/* Actions */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
            }}
          >
            <button
              onClick={onCancel}
              disabled={isGenerating}
              style={{
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                backgroundColor: 'white',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                cursor: isGenerating ? 'not-allowed' : 'pointer',
                opacity: isGenerating ? 0.5 : 1,
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (!isGenerating) {
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
              onClick={() => onConfirm(editedPrompt)}
              disabled={isGenerating || !editedPrompt.trim()}
              style={{
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: '500',
                color: 'white',
                backgroundColor: isGenerating ? '#9ca3af' : '#10b981',
                border: 'none',
                borderRadius: '8px',
                cursor: isGenerating || !editedPrompt.trim() ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (!isGenerating && editedPrompt.trim()) {
                  e.currentTarget.style.backgroundColor = '#059669';
                }
              }}
              onMouseLeave={(e) => {
                if (!isGenerating) {
                  e.currentTarget.style.backgroundColor = '#10b981';
                }
              }}
            >
              {isGenerating ? (
                <>
                  <span
                    style={{
                      display: 'inline-block',
                      animation: 'spin 1s linear infinite',
                    }}
                  >
                    ⏳
                  </span>
                  Regenerating...
                </>
              ) : (
                <>🔄 Regenerate</>
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

export default PromptEditDialog;
