import { type FormEvent, useState } from 'react';

interface GenerationDialogProps {
  onGenerate: (prompt: string) => void;
  onClose: () => void;
  isGenerating: boolean;
}

const GenerationDialog = ({ onGenerate, onClose, isGenerating }: GenerationDialogProps) => {
  const [prompt, setPrompt] = useState('');

  const examples = [
    'Todo list with checkboxes and delete buttons',
    'Calculator with basic math operations',
    'Timer with start, pause, and reset',
    'Color palette generator',
    'Markdown editor with live preview',
    'Weather widget with temperature display',
    'Note-taking app with categories',
    'Expense tracker with charts',
  ];

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onGenerate(prompt);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        style={{
          background: 'white',
          padding: '30px',
          borderRadius: '12px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          minWidth: '500px',
          maxWidth: '600px',
          animation: 'scaleIn 0.3s ease-out',
        }}
      >
      <h2 style={{ marginTop: 0 }}>🤖 Generate AI App</h2>

      <form onSubmit={handleSubmit}>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your app in natural language..."
          style={{
            width: '100%',
            minHeight: '100px',
            padding: '12px',
            fontSize: '16px',
            border: '2px solid #e5e7eb',
            borderRadius: '8px',
            resize: 'vertical',
            boxSizing: 'border-box',
          }}
          disabled={isGenerating}
        />

        <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
          <button
            type="submit"
            disabled={isGenerating || !prompt.trim()}
            style={{
              padding: '10px 20px',
              background: isGenerating ? '#9ca3af' : '#6366f1',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: isGenerating ? 'wait' : 'pointer',
              flex: 1,
            }}
          >
            {isGenerating ? '⚡ Generating...' : 'Generate App'}
          </button>

          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '10px 20px',
              background: '#f3f4f6',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </form>

      <div style={{ marginTop: '20px' }}>
        <h4>Example Prompts:</h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {examples.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => setPrompt(example)}
              style={{
                padding: '6px 12px',
                background: '#f3f4f6',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#e5e7eb';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#f3f4f6';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      {isGenerating && (
        <div
          style={{
            marginTop: '20px',
            padding: '10px',
            background: '#fef3c7',
            borderRadius: '8px',
            textAlign: 'center',
          }}
        >
          ⚡ Generating with Cerebras... Should take less than 5 seconds!
        </div>
      )}
      </div>
    </div>
  );
};

export default GenerationDialog;
