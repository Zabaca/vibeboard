import React from 'react';
import CodeEditor from './CodeEditor.tsx';

interface CodeEditSectionProps {
  editedCode: string;
  setEditedCode: (code: string) => void;
  leftWidth: number;
  copyFeedback: string | null;
  handleCopyCode: () => void;
}

// Memoized component to prevent re-renders when refinementPrompt changes
const CodeEditSection = React.memo(({ 
  editedCode, 
  setEditedCode, 
  leftWidth, 
  copyFeedback, 
  handleCopyCode 
}: CodeEditSectionProps) => {
  console.log('[CodeEditSection] Rendering');
  
  return (
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
  );
});

CodeEditSection.displayName = 'CodeEditSection';

export default CodeEditSection;