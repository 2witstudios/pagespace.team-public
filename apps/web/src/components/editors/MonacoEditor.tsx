import React, { useEffect } from 'react';
import Editor from '@monaco-editor/react';

interface MonacoEditorProps {
  value: string;
  onChange: (value: string | undefined) => void;
  readOnly?: boolean;
  language?: string;
}

const MonacoEditor = ({ value, onChange, readOnly, language = 'markdown' }: MonacoEditorProps) => {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.MonacoEnvironment = {
        getWorkerUrl: (_moduleId: string, label: string) => {
          if (label === 'json') return '/_next/static/json.worker.js';
          if (label === 'css') return '/_next/static/css.worker.js';
          if (label === 'html') return '/_next/static/html.worker.js';
          if (label === 'typescript' || label === 'javascript')
            return '/_next/static/ts.worker.js';
          return '/_next/static/editor.worker.js';
        },
      };
    }
  }, []);

  return (
    <Editor
      height="100%"
      language={language}
      value={value}
      onChange={onChange}
      options={{
        readOnly,
        minimap: { enabled: true },
        wordWrap: 'on',
        scrollBeyondLastLine: false,
        fontSize: 16,
        lineNumbers: 'on',
        glyphMargin: true,
        folding: true,
        lineDecorationsWidth: 10,
        lineNumbersMinChars: 3,
        renderLineHighlight: 'none',
        scrollbar: {
          vertical: 'auto',
          horizontal: 'auto'
        },
      }}
    />
  );
};

export default MonacoEditor;