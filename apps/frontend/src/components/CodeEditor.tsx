import React from 'react';
import CodeHighlight from './CodeHighlight.tsx';

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  language?: 'javascript' | 'jsx' | 'typescript' | 'tsx';
}

const CodeEditor: React.FC<CodeEditorProps> = ({ 
  value, 
  placeholder = '// Enter your component code here...',
  language = 'jsx'
}) => {
  
  // For now, always show read-only highlighted code
  return (
    <div style={{
      width: '100%',
      height: '100%',
      backgroundColor: '#1e1e1e',
      borderRadius: '8px',
      overflow: 'hidden',
    }}>
      <CodeHighlight code={value || placeholder} language={language} />
    </div>
  );
};

export default CodeEditor;