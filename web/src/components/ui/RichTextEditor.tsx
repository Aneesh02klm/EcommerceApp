'use client';

import { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { Highlight } from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import { Bold, Italic, Strikethrough, Heading1, Heading2, List, ListOrdered, Quote, Undo, Redo, CodeXml, AlignLeft, AlignCenter, AlignRight, AlignJustify } from 'lucide-react';

const MenuBar = ({ editor, isSourceMode, setIsSourceMode }: { editor: any, isSourceMode: boolean, setIsSourceMode: (val: boolean) => void }) => {
  if (!editor) {
    return null;
  }

  const btnClass = "p-2 rounded hover:bg-gray-100 text-gray-700 transition-colors";
  const activeClass = "p-2 rounded bg-amber-100 text-amber-700 font-bold transition-colors";

  return (
    <div className="border-b border-gray-200 p-2 flex flex-wrap gap-1 bg-gray-50 rounded-t items-center">
      <button onClick={() => setIsSourceMode(!isSourceMode)} className={isSourceMode ? activeClass : btnClass} title="Toggle Source Code View">
        <CodeXml size={16} />
      </button>
      
      {!isSourceMode && (
          <>
          <div className="w-px h-6 bg-gray-300 mx-1 my-auto" />
          <button onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? activeClass : btnClass} title="Bold">
            <Bold size={16} />
          </button>
          <button onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? activeClass : btnClass} title="Italic">
            <Italic size={16} />
          </button>
          <button onClick={() => editor.chain().focus().toggleStrike().run()} className={editor.isActive('strike') ? activeClass : btnClass} title="Strikethrough">
            <Strikethrough size={16} />
          </button>
          
          <div className="w-px h-6 bg-gray-300 mx-1 my-auto" />
          
          <input 
            type="color" 
            onInput={event => editor.chain().focus().setColor((event.target as HTMLInputElement).value).run()} 
            value={editor.getAttributes('textStyle').color || '#000000'}
            className="w-8 h-8 p-1 rounded cursor-pointer border-0 bg-transparent"
            title="Text Color"
          />
          <button onClick={() => editor.chain().focus().toggleHighlight().run()} className={editor.isActive('highlight') ? activeClass : btnClass} title="Highlight Background">
            <div className="w-4 h-4 bg-yellow-300 rounded-sm border border-gray-400"></div>
          </button>

          <div className="w-px h-6 bg-gray-300 mx-1 my-auto" />
          <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={editor.isActive('heading', { level: 1 }) ? activeClass : btnClass} title="Heading 1">
            <Heading1 size={16} />
          </button>
          <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={editor.isActive('heading', { level: 2 }) ? activeClass : btnClass} title="Heading 2">
            <Heading2 size={16} />
          </button>
          <div className="w-px h-6 bg-gray-300 mx-1 my-auto" />
          
          <button onClick={() => editor.chain().focus().setTextAlign('left').run()} className={editor.isActive({ textAlign: 'left' }) ? activeClass : btnClass}><AlignLeft size={16} /></button>
          <button onClick={() => editor.chain().focus().setTextAlign('center').run()} className={editor.isActive({ textAlign: 'center' }) ? activeClass : btnClass}><AlignCenter size={16} /></button>
          <button onClick={() => editor.chain().focus().setTextAlign('right').run()} className={editor.isActive({ textAlign: 'right' }) ? activeClass : btnClass}><AlignRight size={16} /></button>
          <button onClick={() => editor.chain().focus().setTextAlign('justify').run()} className={editor.isActive({ textAlign: 'justify' }) ? activeClass : btnClass}><AlignJustify size={16} /></button>

          <div className="w-px h-6 bg-gray-300 mx-1 my-auto" />
          <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? activeClass : btnClass} title="Bullet List">
            <List size={16} />
          </button>
          <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive('orderedList') ? activeClass : btnClass} title="Ordered List">
            <ListOrdered size={16} />
          </button>
          <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className={editor.isActive('blockquote') ? activeClass : btnClass} title="Blockquote">
            <Quote size={16} />
          </button>
          <div className="w-px h-6 bg-gray-300 mx-1 my-auto" />
          <button onClick={() => editor.chain().focus().undo().run()} className={btnClass} title="Undo">
            <Undo size={16} />
          </button>
          <button onClick={() => editor.chain().focus().redo().run()} className={btnClass} title="Redo">
            <Redo size={16} />
          </button>
          </>
      )}
    </div>
  );
};

export function RichTextEditor({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  const [isSourceMode, setIsSourceMode] = useState(false);
  const [htmlValue, setHtmlValue] = useState(value);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setHtmlValue(html);
      onChange(html);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm text-gray-500 max-w-none focus:outline-none min-h-[300px] p-6 bg-white',
      },
    },
  });

  // Keep editor synced if source mode changes it
  useEffect(() => {
    if (editor && editor.getHTML() !== value) {
      editor.commands.setContent(value);
      setHtmlValue(value);
    }
  }, [value, editor]);

  return (
    <div className="border border-gray-200 rounded overflow-hidden shadow-sm flex flex-col">
      <MenuBar editor={editor} isSourceMode={isSourceMode} setIsSourceMode={setIsSourceMode} />
      
      {isSourceMode ? (
        <textarea
          value={htmlValue}
          onChange={(e) => {
            setHtmlValue(e.target.value);
            onChange(e.target.value);
          }}
          className="w-full min-h-[300px] p-4 font-mono text-sm bg-gray-900 text-green-400 focus:outline-none resize-y"
          placeholder="<html>...</html>"
        />
      ) : (
        <EditorContent editor={editor} className="flex-1" />
      )}
    </div>
  );
}
