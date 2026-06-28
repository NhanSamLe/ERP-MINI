import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import {
  Bold, Italic, Underline as UnderlineIcon, List, ListOrdered,
  Link as LinkIcon, AlignLeft, AlignCenter, AlignRight,
  Quote, Minus, Undo, Redo, Strikethrough, Highlighter,
} from "lucide-react";

interface Props {
  value: string;
  onChange: (html: string) => void;
  minHeight?: number;
}

const TEXT_COLORS = [
  "#000000", "#434343", "#666666", "#999999", "#b7b7b7", "#cccccc", "#d9d9d9", "#ffffff",
  "#ff0000", "#ff9900", "#ffff00", "#00ff00", "#00ffff", "#4a86e8", "#0000ff", "#9900ff",
  "#ff00ff", "#e6b8a2", "#f4cccc", "#fce5cd", "#fff2cc", "#d9ead3", "#d0e0e3", "#c9daf8",
  "#ea9999", "#f9cb9c", "#ffe599", "#b6d7a8", "#a2c4c9", "#9fc5e8", "#b4a7d6", "#ea9999",
  "#e06666", "#f6b26b", "#ffd966", "#93c47d", "#76a5af", "#6fa8dc", "#8e7cc3", "#c27ba0",
  "#cc0000", "#e69138", "#f1c232", "#6aa84f", "#45818e", "#3d85c6", "#674ea7", "#a64d79",
  "#990000", "#b45f06", "#bf9000", "#38761d", "#134f5c", "#1155cc", "#351c75", "#741b47",
  "#660000", "#783f04", "#7f6000", "#274e13", "#0c343d", "#1c4587", "#20124d", "#4c1130",
];
const HIGHLIGHT_COLORS = ["#ffff00", "#00ff00", "#00ffff", "#ff69b4", "#ffa500", "#ff0000"];

export default function TipTapEditor({ value, onChange, minHeight = 220 }: Props) {
  const [linkPopover, setLinkPopover] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [showTextColors, setShowTextColors] = useState(false);
  const [showHighlightColors, setShowHighlightColors] = useState(false);
  const linkInputRef = useRef<HTMLInputElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const highlightPickerRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false, HTMLAttributes: { class: "text-blue-600 underline cursor-pointer" } }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: { attributes: { class: "focus:outline-none" } },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "");
    }
  }, [value, editor]);

  useEffect(() => {
    if (linkPopover && linkInputRef.current) linkInputRef.current.focus();
  }, [linkPopover]);

  // Close color pickers on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
        setShowTextColors(false);
      }
      if (highlightPickerRef.current && !highlightPickerRef.current.contains(e.target as Node)) {
        setShowHighlightColors(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!editor) return null;

  const applyLink = () => {
    if (linkUrl) {
      const url = linkUrl.startsWith("http") ? linkUrl : `https://${linkUrl}`;
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    } else {
      editor.chain().focus().unsetLink().run();
    }
    setLinkPopover(false);
    setLinkUrl("");
  };

  const ToolBtn = ({
    onClick, active, title, children, className = "",
  }: { onClick: () => void; active?: boolean; title: string; children: React.ReactNode; className?: string }) => (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      className={`p-1.5 rounded transition-colors ${active
        ? "bg-gray-200 text-gray-900"
        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      } ${className}`}
    >
      {children}
    </button>
  );

  const Divider = () => <div className="w-px h-5 bg-gray-200 mx-0.5 flex-shrink-0" />;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:ring-2 focus-within:ring-orange-400 focus-within:border-transparent transition-all">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 bg-gray-50 border-b border-gray-200">

        {/* Undo / Redo */}
        <ToolBtn onClick={() => editor.chain().focus().undo().run()} title="Hoàn tác (Ctrl+Z)">
          <Undo className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().redo().run()} title="Làm lại (Ctrl+Y)">
          <Redo className="w-3.5 h-3.5" />
        </ToolBtn>

        <Divider />

        {/* B / I / U / S */}
        <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="In đậm (Ctrl+B)">
          <Bold className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="In nghiêng (Ctrl+I)">
          <Italic className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Gạch chân (Ctrl+U)">
          <UnderlineIcon className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Gạch ngang">
          <Strikethrough className="w-3.5 h-3.5" />
        </ToolBtn>

        <Divider />

        {/* Text color */}
        <div className="relative" ref={colorPickerRef}>
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); setShowTextColors(v => !v); setShowHighlightColors(false); }}
            title="Màu chữ"
            className="flex flex-col items-center p-1.5 rounded hover:bg-gray-100 transition-colors"
          >
            <span className="text-xs font-bold text-gray-700 leading-none" style={{ fontFamily: "serif" }}>A</span>
            <div className="w-4 h-1 mt-0.5 rounded-sm" style={{ backgroundColor: editor.getAttributes("textStyle").color || "#000000" }} />
          </button>
          {showTextColors && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-xl p-2 w-56">
              <p className="text-xs text-gray-500 mb-1.5 font-medium">Màu chữ</p>
              <div className="grid grid-cols-8 gap-0.5">
                {TEXT_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setColor(c).run(); setShowTextColors(false); }}
                    className="w-6 h-6 rounded border border-gray-100 hover:scale-110 transition-transform"
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
              </div>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().unsetColor().run(); setShowTextColors(false); }}
                className="mt-1.5 w-full text-xs text-gray-500 hover:text-gray-700 py-0.5"
              >
                Remove color
              </button>
            </div>
          )}
        </div>

        {/* Highlight color */}
        <div className="relative" ref={highlightPickerRef}>
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); setShowHighlightColors(v => !v); setShowTextColors(false); }}
            title="Màu đánh dấu"
            className="p-1.5 rounded hover:bg-gray-100 transition-colors"
          >
            <Highlighter className="w-3.5 h-3.5 text-gray-600" />
          </button>
          {showHighlightColors && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-xl p-2">
              <p className="text-xs text-gray-500 mb-1.5 font-medium">Màu đánh dấu</p>
              <div className="flex gap-1">
                {HIGHLIGHT_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleHighlight({ color: c }).run(); setShowHighlightColors(false); }}
                    className="w-6 h-6 rounded border border-gray-100 hover:scale-110 transition-transform"
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <Divider />

        {/* Align */}
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} title="Căn trái">
          <AlignLeft className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} title="Căn giữa">
          <AlignCenter className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} title="Căn phải">
          <AlignRight className="w-3.5 h-3.5" />
        </ToolBtn>

        <Divider />

        {/* Lists */}
        <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Danh sách dấu đầu dòng">
          <List className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Danh sách đánh số">
          <ListOrdered className="w-3.5 h-3.5" />
        </ToolBtn>

        <Divider />

        {/* Blockquote & HR */}
        <ToolBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Trích dẫn">
          <Quote className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Đường phân cách">
          <Minus className="w-3.5 h-3.5" />
        </ToolBtn>

        <Divider />

        {/* Link */}
        <div className="relative">
          <ToolBtn onClick={() => setLinkPopover(v => !v)} active={editor.isActive("link") || linkPopover} title="Chèn liên kết">
            <LinkIcon className="w-3.5 h-3.5" />
          </ToolBtn>
          {linkPopover && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-2 flex items-center gap-2 w-72">
              <input
                ref={linkInputRef}
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") applyLink(); if (e.key === "Escape") setLinkPopover(false); }}
                placeholder="https://..."
                className="flex-1 border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-orange-400"
              />
              <button type="button" onClick={applyLink} className="px-2 py-1 bg-orange-500 text-white rounded text-sm hover:bg-orange-600">
                Apply
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Editor Content */}
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none p-4 text-gray-800 overflow-y-auto"
        style={{ minHeight }}
        onClick={() => editor.commands.focus()}
      />
    </div>
  );
}
