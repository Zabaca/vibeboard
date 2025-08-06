import React from 'react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-jsx';
import 'prismjs/themes/prism-tomorrow.css';
import CodeHighlight from './CodeHighlight.tsx';

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  language?: 'javascript' | 'jsx' | 'typescript' | 'tsx';
}

// Add custom styles for the editor
const editorStyles = `
  .code-editor-textarea {
    outline: none !important;
    background: transparent !important;
    caret-color: #d4d4d4;
  }
  
  .code-editor-pre {
    margin: 0 !important;
    background: transparent !important;
  }
  
  /* Override Prism Tomorrow theme for our dark background */
  .token.comment,
  .token.prolog,
  .token.doctype,
  .token.cdata {
    color: #6a9955;
  }
  
  .token.punctuation {
    color: #d4d4d4;
  }
  
  .token.property,
  .token.tag,
  .token.boolean,
  .token.number,
  .token.constant,
  .token.symbol,
  .token.deleted {
    color: #b5cea8;
  }
  
  .token.selector,
  .token.attr-name,
  .token.string,
  .token.char,
  .token.builtin,
  .token.inserted {
    color: #ce9178;
  }
  
  .token.operator,
  .token.entity,
  .token.url,
  .language-css .token.string,
  .style .token.string {
    color: #d4d4d4;
  }
  
  .token.atrule,
  .token.attr-value,
  .token.keyword {
    color: #c586c0;
  }
  
  .token.function,
  .token.class-name {
    color: #dcdcaa;
  }
  
  .token.regex,
  .token.important,
  .token.variable {
    color: #d16969;
  }
`;

// Inject styles if not already present
if (typeof document !== 'undefined' && !document.querySelector('#code-editor-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'code-editor-styles';
  styleSheet.textContent = editorStyles;
  document.head.appendChild(styleSheet);
}

const CodeEditor: React.FC<CodeEditorProps> = ({ 
  value, 
  onChange,
  placeholder = '// Enter your component code here...',
  readOnly = false,
  language = 'jsx'
}) => {
  
  // If onChange is provided and not readOnly, show editable code editor
  if (onChange && !readOnly) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#1e1e1e',
        borderRadius: '8px',
        overflow: 'auto',
      }}>
        <Editor
          value={value}
          onValueChange={onChange}
          highlight={code => (
            <div dangerouslySetInnerHTML={{
              __html: Prism.highlight(
                code || '', 
                Prism.languages[language] || Prism.languages.javascript, 
                language
              )
            }} />
          )}
          padding={16}
          style={{
            fontFamily: 'Consolas, Monaco, "Courier New", monospace',
            fontSize: 14,
            lineHeight: 1.5,
            backgroundColor: '#1e1e1e',
            color: '#d4d4d4',
            minHeight: '100%',
          }}
          textareaClassName="code-editor-textarea"
          preClassName="code-editor-pre"
        />
      </div>
    );
  }
  
  // Otherwise show read-only highlighted code
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

export default React.memo(CodeEditor);