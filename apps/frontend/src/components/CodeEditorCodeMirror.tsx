import React, { useEffect, useRef } from 'react';
import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightSpecialChars, drawSelection, dropCursor, rectangularSelection, crosshairCursor, highlightActiveLine } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import { defaultKeymap, indentWithTab, history, historyKeymap } from '@codemirror/commands';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { autocompletion, completionKeymap, closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { lintKeymap } from '@codemirror/lint';
import { foldGutter, indentOnInput, syntaxHighlighting, defaultHighlightStyle, bracketMatching, foldKeymap } from '@codemirror/language';

interface CodeEditorCodeMirrorProps {
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}

const CodeEditorCodeMirror: React.FC<CodeEditorCodeMirrorProps> = ({ 
  value, 
  onChange,
  placeholder = '// Enter your component code here...',
  readOnly = false,
}) => {
  // Note: placeholder is currently not used due to CodeMirror setup
  void placeholder; // Suppress unused variable warning
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  
  // Keep onChange ref updated
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Create the editor state
    const startState = EditorState.create({
      doc: value || '',
      extensions: [
        // Basic editor features
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightSpecialChars(),
        history(),
        foldGutter(),
        drawSelection(),
        dropCursor(),
        EditorState.allowMultipleSelections.of(true),
        indentOnInput(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        bracketMatching(),
        closeBrackets(),
        autocompletion(),
        rectangularSelection(),
        crosshairCursor(),
        highlightActiveLine(),
        highlightSelectionMatches(),
        
        // Language support
        javascript({ jsx: true }),
        
        // Theme
        oneDark,
        
        // Keymaps
        keymap.of([
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...searchKeymap,
          ...historyKeymap,
          ...foldKeymap,
          ...completionKeymap,
          ...lintKeymap,
          indentWithTab,
        ]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged && onChangeRef.current) {
            const newValue = update.state.doc.toString();
            onChangeRef.current(newValue);
          }
        }),
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
          '.cm-placeholder': {
            color: '#666',
            fontStyle: 'italic',
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
  }, [readOnly]); // Only recreate on readOnly change
  
  // Update content when value prop changes (but not from our own changes)
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

export default React.memo(CodeEditorCodeMirror);