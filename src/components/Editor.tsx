import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import { undo, redo, history } from '@codemirror/commands';
import { openSearchPanel, setSearchQuery, SearchQuery } from '@codemirror/search';

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  isDarkMode: boolean;
}

export interface EditorHandle {
  undo: () => void;
  redo: () => void;
  find: (query?: string) => void;
  focus: () => void;
}

const Editor = forwardRef<EditorHandle, EditorProps>(({ value, onChange, isDarkMode }, ref) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  useImperativeHandle(ref, () => ({
    undo: () => { if (viewRef.current) undo(viewRef.current); },
    redo: () => { if (viewRef.current) redo(viewRef.current); },
    focus: () => { if (viewRef.current) viewRef.current.focus(); },
    find: (query?: string) => { 
      if (viewRef.current) {
        openSearchPanel(viewRef.current); 
        if (query) {
          const view = viewRef.current;
          setTimeout(() => {
            const searchQuery = new SearchQuery({ search: query });
            view.dispatch({
              effects: setSearchQuery.of(searchQuery)
            });
          }, 10);
        }
      }
    }
  }));

  useEffect(() => {
    if (!editorRef.current) return;

    const lightTheme = EditorView.theme({
      "&": { height: "100%", backgroundColor: "#ffffff", color: "#1f2937" },
      ".cm-content": { fontFamily: "'JetBrains Mono', monospace", fontSize: "13px" },
      ".cm-gutters": { backgroundColor: "#f3f4f6", color: "#6b7280", borderRight: "1px solid #d1d5db" },
      ".cm-activeLine": { backgroundColor: "#f3f4f6" },
      ".cm-activeLineGutter": { backgroundColor: "#e5e7eb" },
      ".cm-cursor": { borderLeftColor: "#1f2937" }
    });

    const themeExtension = isDarkMode ? oneDark : lightTheme;

    const state = EditorState.create({
      doc: value,
      extensions: [
        basicSetup,
        history(),
        markdown(),
        themeExtension,
        // Removed internal scrollbar theme to use unified global index.css settings
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChange(update.state.doc.toString());
          }
        })
      ],
    });

    viewRef.current = new EditorView({
      state,
      parent: editorRef.current,
    });

    return () => {
      viewRef.current?.destroy();
    };
  }, [isDarkMode]);

  useEffect(() => {
    if (viewRef.current && value !== viewRef.current.state.doc.toString()) {
      viewRef.current.dispatch({
        changes: { from: 0, to: viewRef.current.state.doc.length, insert: value },
      });
    }
  }, [value]);

  return <div ref={editorRef} className="h-full w-full outline-none" />;
});

export default Editor;
