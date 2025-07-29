"use client";

import { useEditor, EditorContent, Editor } from '@tiptap/react';
import { BubbleMenu, FloatingMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';
import React, { useCallback, useEffect, useRef } from 'react';
import { Bold, Italic, Strikethrough, Code, Heading1, Heading2, Heading3, Pilcrow, List, ListOrdered, Quote } from 'lucide-react';
import { Placeholder, CharacterCount } from '@tiptap/extensions';
import { TextStyleKit } from '@tiptap/extension-text-style';
import { TableKit } from '@tiptap/extension-table';
import { formatHtml } from '@/lib/prettier';
import { PageMention } from '@/lib/tiptap-mention-config';

interface RichEditorProps {
  value: string;
  onChange: (value: string) => void;
  onEditorChange: (editor: Editor | null) => void;
}

const RichEditor = ({ value, onChange, onEditorChange }: RichEditorProps) => {
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const debouncedOnChange = useCallback(
    (editor: Editor) => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
      debounceTimeout.current = setTimeout(async () => {
        const html = editor.getHTML();
        const formattedHtml = await formatHtml(html);
        onChange(formattedHtml);
      }, 500);
    },
    [onChange]
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        link: {
          openOnClick: true,
        },
      }),
      Markdown,
      Placeholder.configure({
        placeholder: 'Start writing...',
      }),
      TextStyleKit,
      TableKit,
      CharacterCount,
      PageMention,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      debouncedOnChange(editor);
    },
    editorProps: {
      attributes: {
        class: 'tiptap m-5 focus:outline-none',
      },
      scrollThreshold: 80,
      scrollMargin: 80,
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  useEffect(() => {
    onEditorChange(editor);
    return () => {
      onEditorChange(null);
    };
  }, [editor, onEditorChange]);


  return (
    <div className="relative flex flex-col w-full h-full">
      {editor && (
        <BubbleMenu
          editor={editor}
          pluginKey="bubbleMenu"
          shouldShow={({ from, to }) => {
            // show the bubble menu when the user selects some text
            return from !== to;
          }}
          className="flex items-center gap-1 p-2 border rounded-md bg-card shadow-lg"
        >
          <button onClick={() => editor.chain().focus().toggleBold().run()} className={`p-2 rounded ${editor.isActive('bold') ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}><Bold size={16} /></button>
          <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`p-2 rounded ${editor.isActive('italic') ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}><Italic size={16} /></button>
          <button onClick={() => editor.chain().focus().toggleStrike().run()} className={`p-2 rounded ${editor.isActive('strike') ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}><Strikethrough size={16} /></button>
          <button onClick={() => editor.chain().focus().toggleCode().run()} className={`p-2 rounded ${editor.isActive('code') ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}><Code size={16} /></button>
          <div className="w-[1px] h-6 bg-muted-foreground/50 mx-2" />
          <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={`p-2 rounded ${editor.isActive('heading', { level: 1 }) ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}><Heading1 size={16} /></button>
          <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`p-2 rounded ${editor.isActive('heading', { level: 2 }) ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}><Heading2 size={16} /></button>
          <button onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={`p-2 rounded ${editor.isActive('heading', { level: 3 }) ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}><Heading3 size={16} /></button>
        </BubbleMenu>
      )}
      {editor && (
        <FloatingMenu
          editor={editor}
          pluginKey="floatingMenu"
          shouldShow={({ editor, from }) => {
            // show the floating menu when the user types `/`
            return editor.state.doc.textBetween(from - 1, from) === '/';
          }}
          className="flex flex-col gap-1 p-2 border rounded-md bg-card shadow-lg"
        >
          <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={`flex items-center gap-2 p-2 rounded ${editor.isActive('heading', { level: 1 }) ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}><Heading1 size={16} /><span>Heading 1</span></button>
          <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`flex items-center gap-2 p-2 rounded ${editor.isActive('heading', { level: 2 }) ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}><Heading2 size={16} /><span>Heading 2</span></button>
          <button onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={`flex items-center gap-2 p-2 rounded ${editor.isActive('heading', { level: 3 }) ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}><Heading3 size={16} /><span>Heading 3</span></button>
          <button onClick={() => editor.chain().focus().setParagraph().run()} className={`flex items-center gap-2 p-2 rounded ${editor.isActive('paragraph') ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}><Pilcrow size={16} /><span>Paragraph</span></button>
          <div className="w-full h-[1px] bg-muted-foreground/50 my-1" />
          <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={`flex items-center gap-2 p-2 rounded ${editor.isActive('bulletList') ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}><List size={16} /><span>Bullet List</span></button>
          <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`flex items-center gap-2 p-2 rounded ${editor.isActive('orderedList') ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}><ListOrdered size={16} /><span>Ordered List</span></button>
          <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className={`flex items-center gap-2 p-2 rounded ${editor.isActive('blockquote') ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}><Quote size={16} /><span>Quote</span></button>
        </FloatingMenu>
      )}
      <div className="flex-1 overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
      <div className="flex justify-end p-2 text-sm text-muted-foreground">
        {editor?.storage.characterCount.characters()} characters
      </div>
    </div>
  );
};

export default RichEditor;