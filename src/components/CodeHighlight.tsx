import React, { useEffect, useRef } from 'react';

// Type for Prism global
interface PrismGlobal {
  highlightElement: (element: HTMLElement) => void;
}

// Dynamic Prism.js loading
let prismPromise: Promise<PrismGlobal> | null = null;

const loadPrism = async () => {
  if (prismPromise) return prismPromise;
  
  prismPromise = new Promise((resolve) => {
    // Check if already loaded
    const globalPrism = (window as { Prism?: PrismGlobal }).Prism;
    if (globalPrism) {
      resolve(globalPrism);
      return;
    }
    
    // Load Prism CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css';
    document.head.appendChild(link);
    
    // Load Prism JS
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js';
    script.onload = async () => {
      // Load additional components in sequence
      const scripts = [
        'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-jsx.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/plugins/line-numbers/prism-line-numbers.min.js'
      ];
      
      for (const src of scripts) {
        await new Promise<void>((resolveScript) => {
          const s = document.createElement('script');
          s.src = src;
          s.onload = () => resolveScript();
          document.head.appendChild(s);
        });
      }
      
      // Load line numbers CSS
      const lineNumbersLink = document.createElement('link');
      lineNumbersLink.rel = 'stylesheet';
      lineNumbersLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/plugins/line-numbers/prism-line-numbers.min.css';
      document.head.appendChild(lineNumbersLink);
      
      const loadedPrism = (window as { Prism?: PrismGlobal }).Prism;
      if (loadedPrism) {
        resolve(loadedPrism);
      }
    };
    document.head.appendChild(script);
  });
  
  return prismPromise;
};

interface CodeHighlightProps {
  code: string;
  language?: 'javascript' | 'jsx' | 'typescript' | 'tsx';
  showLineNumbers?: boolean;
}

const CodeHighlight: React.FC<CodeHighlightProps> = ({ 
  code, 
  language = 'jsx',
  showLineNumbers = true 
}) => {
  const codeRef = useRef<HTMLElement>(null);
  
  useEffect(() => {
    const highlight = async () => {
      const Prism = await loadPrism();
      if (codeRef.current && Prism) {
        Prism.highlightElement(codeRef.current);
      }
    };
    
    highlight();
  }, [code, language]);
  
  return (
    <pre 
      className={showLineNumbers ? 'line-numbers' : ''}
      style={{
        margin: 0,
        padding: 0,
        background: 'transparent',
        fontSize: '14px',
        lineHeight: '1.6',
        height: '100%',
        overflow: 'auto',
      }}
    >
      <code
        ref={codeRef}
        className={`language-${language}`}
        style={{
          fontFamily: 'Monaco, Consolas, "Courier New", monospace',
          whiteSpace: 'pre',
          wordWrap: 'normal',
          display: 'block',
          padding: '16px',
        }}
      >
        {code}
      </code>
    </pre>
  );
};

export default CodeHighlight;