import React, { useState, useEffect, useRef, useCallback } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-jsx';
import 'prismjs/themes/prism-tomorrow.css';

interface CodeEditorFastProps {
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}

// Add custom styles for the editor
const editorStyles = `
  .code-editor-fast-container {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #1e1e1e;
    border-radius: 8px;
  }
  
  .code-editor-fast-textarea {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    padding: 16px;
    margin: 0;
    border: none;
    outline: none;
    resize: none;
    background: transparent;
    color: transparent;
    caret-color: #d4d4d4;
    font-family: Consolas, Monaco, "Courier New", monospace;
    font-size: 14px;
    line-height: 1.5;
    white-space: pre;
    overflow-wrap: normal;
    overflow: auto;
    z-index: 2;
  }
  
  .code-editor-fast-highlights {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    padding: 16px;
    margin: 0;
    border: none;
    background: transparent;
    color: #d4d4d4;
    font-family: Consolas, Monaco, "Courier New", monospace;
    font-size: 14px;
    line-height: 1.5;
    white-space: pre;
    overflow-wrap: normal;
    overflow: auto;
    pointer-events: none;
    z-index: 1;
    /* Hide scrollbar on highlights since textarea handles scrolling */
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  
  .code-editor-fast-highlights::-webkit-scrollbar {
    display: none;
  }
  
  .code-editor-fast-highlights code {
    background: transparent !important;
    padding: 0 !important;
    margin: 0 !important;
    display: block !important;
  }
  
  /* Override Prism styles for our dark background */
  .code-editor-fast-highlights .token.comment,
  .code-editor-fast-highlights .token.prolog,
  .code-editor-fast-highlights .token.doctype,
  .code-editor-fast-highlights .token.cdata {
    color: #6a9955;
  }
  
  .code-editor-fast-highlights .token.punctuation {
    color: #d4d4d4;
  }
  
  .code-editor-fast-highlights .token.property,
  .code-editor-fast-highlights .token.tag,
  .code-editor-fast-highlights .token.boolean,
  .code-editor-fast-highlights .token.number,
  .code-editor-fast-highlights .token.constant,
  .code-editor-fast-highlights .token.symbol,
  .code-editor-fast-highlights .token.deleted {
    color: #b5cea8;
  }
  
  .code-editor-fast-highlights .token.selector,
  .code-editor-fast-highlights .token.attr-name,
  .code-editor-fast-highlights .token.string,
  .code-editor-fast-highlights .token.char,
  .code-editor-fast-highlights .token.builtin,
  .code-editor-fast-highlights .token.inserted {
    color: #ce9178;
  }
  
  .code-editor-fast-highlights .token.operator,
  .code-editor-fast-highlights .token.entity,
  .code-editor-fast-highlights .token.url,
  .code-editor-fast-highlights .language-css .token.string,
  .code-editor-fast-highlights .style .token.string {
    color: #d4d4d4;
  }
  
  .code-editor-fast-highlights .token.atrule,
  .code-editor-fast-highlights .token.attr-value,
  .code-editor-fast-highlights .token.keyword {
    color: #c586c0;
  }
  
  .code-editor-fast-highlights .token.function,
  .code-editor-fast-highlights .token.class-name {
    color: #dcdcaa;
  }
  
  .code-editor-fast-highlights .token.regex,
  .code-editor-fast-highlights .token.important,
  .code-editor-fast-highlights .token.variable {
    color: #d16969;
  }
`;

// Inject styles if not already present
if (typeof document !== 'undefined') {
  // Remove old styles if they exist
  const oldStyle = document.querySelector('#code-editor-fast-styles-v2');
  if (oldStyle) {
    oldStyle.remove();
  }
  
  const styleSheet = document.createElement('style');
  styleSheet.id = 'code-editor-fast-styles-v2';
  styleSheet.textContent = editorStyles;
  document.head.appendChild(styleSheet);
}

const CodeEditorFast: React.FC<CodeEditorFastProps> = ({ 
  value, 
  onChange,
  placeholder = '// Enter your component code here...',
  readOnly = false,
}) => {
  const [highlightedCode, setHighlightedCode] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);
  const highlightTimeoutRef = useRef<number | undefined>(undefined);
  
  // Sync scroll position
  const handleScroll = useCallback(() => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, []);
  
  // Handle text change
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange?.(newValue);
    
    // Clear existing timeout
    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current);
    }
    
    // Debounce highlighting for very large code
    if (newValue.length > 5000) {
      highlightTimeoutRef.current = window.setTimeout(() => {
        const highlighted = Prism.highlight(newValue, Prism.languages.javascript, 'javascript');
        setHighlightedCode(highlighted);
      }, 100);
    } else {
      // Immediate highlighting for smaller code
      const highlighted = Prism.highlight(newValue, Prism.languages.javascript, 'javascript');
      setHighlightedCode(highlighted);
    }
  }, [onChange]);
  
  // Initial highlighting
  useEffect(() => {
    const highlighted = Prism.highlight(value || '', Prism.languages.javascript, 'javascript');
    setHighlightedCode(highlighted);
  }, [value]);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, []);
  
  if (readOnly) {
    return (
      <div className="code-editor-fast-container">
        <pre className="code-editor-fast-highlights">
          <code dangerouslySetInnerHTML={{ __html: highlightedCode }} />
        </pre>
      </div>
    );
  }
  
  return (
    <div className="code-editor-fast-container">
      <textarea
        ref={textareaRef}
        className="code-editor-fast-textarea"
        value={value}
        onChange={handleChange}
        onScroll={handleScroll}
        placeholder={placeholder}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
      />
      <pre 
        ref={highlightRef}
        className="code-editor-fast-highlights"
        aria-hidden="true"
      >
        <code dangerouslySetInnerHTML={{ __html: highlightedCode || placeholder }} />
      </pre>
    </div>
  );
};

export default React.memo(CodeEditorFast);