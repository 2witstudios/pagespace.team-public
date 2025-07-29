"use client";

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';
import { TreePage } from '@/hooks/usePageTree';
import { useDocumentStore } from '@/stores/useDocumentStore';
import { Editor } from '@tiptap/react';
import Toolbar from '@/components/editors/Toolbar';

interface DocumentViewProps {
  page: TreePage;
}

const MonacoEditor = dynamic(() => import('@/components/editors/MonacoEditor'), { ssr: false });
const RichEditor = dynamic(() => import('@/components/editors/RichEditor'), { ssr: false });

const DocumentView = ({ page }: DocumentViewProps) => {
  const { content, setContent, setDocument, setSaveCallback, activeView } = useDocumentStore();
  const [editor, setEditor] = useState<Editor | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [editorKey, setEditorKey] = useState(1);
  const isRichTextEditing = useRef(false);

  const saveContent = useCallback(async (pageId: string, newValue: string) => {
    console.log(`--- Saving Page ${pageId} ---`);
    console.log('Content:', newValue);
    try {
      const response = await fetch(`/api/pages/${pageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newValue }),
      });
      console.log('Save Response:', response);
      if (!response.ok) {
        throw new Error(`Failed to save page content. Status: ${response.status}`);
      }
      toast.success('Page saved successfully!');
    } catch (error) {
      console.error('Failed to save page content:', error);
      toast.error('Failed to save page content.');
    }
  }, []);

  useEffect(() => {
    const initialText = typeof page.content === 'string' ? page.content : '';
    setDocument(page.id, initialText);
    setSaveCallback(saveContent);

    // If the content is changing from an external source, update the key
    if (!isRichTextEditing.current) {
      setEditorKey(prevKey => prevKey + 1);
    }
  }, [page.id, page.content, setDocument, setSaveCallback, saveContent]);

  return (
    <div ref={containerRef} className="h-full flex flex-col relative">
      {activeView === 'rich' && (
        <div className="flex items-center border-b bg-card">
          <Toolbar editor={editor} />
        </div>
      )}
      <div className="flex-1 flex justify-center items-start p-4 overflow-auto">
        {activeView === 'code' && (
          <MonacoEditor
            value={content}
            onChange={(newValue) => setContent(newValue || '')}
            language="html"
          />
        )}
        {activeView === 'rich' && (
          <RichEditor
            key={editorKey}
            value={content}
            onChange={(newValue) => {
              isRichTextEditing.current = true;
              setContent(newValue || '');
              // Reset the flag after a short delay
              setTimeout(() => {
                isRichTextEditing.current = false;
              }, 1000);
            }}
            onEditorChange={setEditor}
          />
        )}
      </div>
    </div>
  );
};

export default DocumentView;