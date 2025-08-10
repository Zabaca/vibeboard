import React, { useEffect, useRef } from 'react';
import { EditorView, keymap } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import { defaultKeymap } from '@codemirror/commands';

interface CodeEditorSimpleProps {
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}

const CodeEditorSimple: React.FC<CodeEditorSimpleProps> = ({ 
  value, 
  onChange,
  placeholder = '// Enter your component code here...',
  readOnly = false,
}) => {
  // Note: placeholder is currently not used
  void placeholder;
  
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  
  // Keep onChange ref updated
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Create the editor state with minimal extensions
    const startState = EditorState.create({
      doc: value || '',
      extensions: [
        // Language support
        javascript({ jsx: true }),
        
        // Theme
        oneDark,
        
        // Basic keymap
        keymap.of(defaultKeymap),
        
        // Update listener
        EditorView.updateListener.of((update: { docChanged?: boolean; state?: { doc?: { toString(): string } } }) => {
          if (update.docChanged && onChangeRef.current && update.state?.doc) {
            const newValue = update.state.doc.toString();
            onChangeRef.current(newValue);
          }
        }),
        
        // Theme overrides
        EditorView.theme({
          '&': {
            height: '100%',
            fontSize: '14px',
          },
          '.cm-content': {
            padding: '16px',
            fontFamily: 'Consolas, Monaco, "Courier New", monospace',
          },
          '.cm-focused .cm-cursor': {
            borderLeftColor: '#d4d4d4',
          },
          '&.cm-editor': {
            borderRadius: '8px',
          },
          '&.cm-editor.cm-focused': {
            outline: 'none',
          },
          '.cm-scroller': {
            fontFamily: 'Consolas, Monaco, "Courier New", monospace',
          },
        }),
        
        // Read-only state
        EditorState.readOnly.of(readOnly),
        EditorView.editable.of(!readOnly),
      ],
    });
    
    // Create the editor view
    const view = new EditorView({
      state: startState,
      parent: containerRef.current,
    });
    
    viewRef.current = view;
    
    // Cleanup
    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [readOnly, value]);
  
  // Update content when value prop changes
  useEffect(() => {
    if (viewRef.current) {
      const currentValue = viewRef.current.state.doc.toString();
      if (currentValue !== value) {
        viewRef.current.dispatch({
          changes: {
            from: 0,
            to: currentValue.length,
            insert: value || '',
          },
        });
      }
    }
  }, [value]);
  
  return (
    <div 
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#282c34',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    />
  );
};

export default React.memo(CodeEditorSimple);