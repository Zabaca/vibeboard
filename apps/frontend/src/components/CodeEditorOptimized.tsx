import React, { useState, useEffect, useRef, useCallback } from 'react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-typescript';
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

const CodeEditorOptimized: React.FC<CodeEditorProps> = ({ 
  value, 
  onChange,
  placeholder = '// Enter your component code here...',
  readOnly = false,
  language = 'jsx'
}) => {
  // Track the actual text value separately from highlighted content
  const [text, setText] = useState(value);
  const [highlightedCode, setHighlightedCode] = useState('');
  const debounceTimerRef = useRef<number | undefined>(undefined);
  
  // Update text when value prop changes
  useEffect(() => {
    setText(value);
  }, [value]);
  
  // Debounced highlighting for performance
  useEffect(() => {
    // Clear any existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Immediate highlight for small code
    if (text.length < 1000) {
      const highlighted = Prism.highlight(
        text || '', 
        Prism.languages[language] || Prism.languages.javascript, 
        language
      );
      setHighlightedCode(highlighted);
    } else {
      // Debounce for large code
      debounceTimerRef.current = window.setTimeout(() => {
        const highlighted = Prism.highlight(
          text || '', 
          Prism.languages[language] || Prism.languages.javascript, 
          language
        );
        setHighlightedCode(highlighted);
      }, 10);
    }
    
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [text, language]);
  
  const handleChange = useCallback((newValue: string) => {
    setText(newValue);
    onChange?.(newValue);
  }, [onChange]);
  
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
          value={text}
          onValueChange={handleChange}
          highlight={() => (
            <div dangerouslySetInnerHTML={{ __html: highlightedCode }} />
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

export default React.memo(CodeEditorOptimized);