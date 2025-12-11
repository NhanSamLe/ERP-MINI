import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";

interface Props {
  value: string;
  onChange: (html: string) => void;
}

export default function TipTapEditor({ value, onChange }: Props) {
  const editor = useEditor({
    extensions: [StarterKit, Underline, Link.configure({ openOnClick: false })],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "");
    }
  }, [value, editor]);

  if (!editor) return null;

  const addLink = () => {
    const url = prompt("Enter URL:");
    if (url) {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
      {/* Toolbar */}
      <div className="flex gap-0.5 p-3 bg-gray-50 border-b border-gray-200 flex-wrap items-center">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold (Ctrl+B)"
          className={`p-2 rounded hover:bg-gray-200 transition ${
            editor.isActive("bold") ? "bg-gray-300" : ""
          }`}
        >
          <span className="text-sm font-bold text-gray-700">B</span>
        </button>

        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic (Ctrl+I)"
          className={`p-2 rounded hover:bg-gray-200 transition ${
            editor.isActive("italic") ? "bg-gray-300" : ""
          }`}
        >
          <span className="text-sm italic text-gray-700">I</span>
        </button>

        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Underline (Ctrl+U)"
          className={`p-2 rounded hover:bg-gray-200 transition ${
            editor.isActive("underline") ? "bg-gray-300" : ""
          }`}
        >
          <span className="text-sm underline text-gray-700">U</span>
        </button>

        <div className="w-px h-6 bg-gray-300" />

        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet list"
          className={`p-2 rounded hover:bg-gray-200 transition ${
            editor.isActive("bulletList") ? "bg-gray-300" : ""
          }`}
        >
          <span className="text-sm text-gray-700">•</span>
        </button>

        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Numbered list"
          className={`p-2 rounded hover:bg-gray-200 transition ${
            editor.isActive("orderedList") ? "bg-gray-300" : ""
          }`}
        >
          <span className="text-sm text-gray-700">1.</span>
        </button>

        <div className="w-px h-6 bg-gray-300" />

        <button
          onClick={addLink}
          title="Add link"
          className={`p-2 rounded hover:bg-gray-200 transition ${
            editor.isActive("link") ? "bg-gray-300" : ""
          }`}
        >
          <span className="text-sm text-gray-700">🔗</span>
        </button>
      </div>

      {/* Editor Content */}
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none p-4 focus:outline-none min-h-64 max-h-96 overflow-y-auto text-gray-800"
      />
    </div>
  );
}