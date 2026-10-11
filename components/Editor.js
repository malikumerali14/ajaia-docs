'use client';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';

// Remounted (via key) per document. onChange fires only on user edits.
export default function Editor({ content, editable, onChange }) {
  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [1, 2, 3] } }), Underline],
    content,
    editable,
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });
  if (!editor) return null;

  const Btn = ({ label, title, active, run }) => (
    <button type="button" title={title} className={active ? 'on' : ''} onClick={run}>{label}</button>
  );
  return (
    <div>
      {editable && (
        <div className="toolbar">
          <Btn label="H1" title="Heading 1" active={editor.isActive('heading', { level: 1 })} run={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} />
          <Btn label="H2" title="Heading 2" active={editor.isActive('heading', { level: 2 })} run={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} />
          <Btn label="H3" title="Heading 3" active={editor.isActive('heading', { level: 3 })} run={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} />
          <Btn label={<b>B</b>} title="Bold" active={editor.isActive('bold')} run={() => editor.chain().focus().toggleBold().run()} />
          <Btn label={<i>I</i>} title="Italic" active={editor.isActive('italic')} run={() => editor.chain().focus().toggleItalic().run()} />
          <Btn label={<u>U</u>} title="Underline" active={editor.isActive('underline')} run={() => editor.chain().focus().toggleUnderline().run()} />
          <Btn label="• List" title="Bulleted list" active={editor.isActive('bulletList')} run={() => editor.chain().focus().toggleBulletList().run()} />
          <Btn label="1. List" title="Numbered list" active={editor.isActive('orderedList')} run={() => editor.chain().focus().toggleOrderedList().run()} />
          <Btn label="Normal" title="Paragraph" active={false} run={() => editor.chain().focus().setParagraph().run()} />
        </div>
      )}
      <div className={'page' + (editable ? '' : ' solo')}><EditorContent editor={editor} /></div>
    </div>
  );
}
