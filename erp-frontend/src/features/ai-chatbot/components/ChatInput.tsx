import { useState, KeyboardEvent, useRef, useEffect } from "react";
import { ArrowUp } from "lucide-react";

interface Props {
  onSend: (content: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function ChatInput({
  onSend,
  disabled = false,
  placeholder = "Nhập câu hỏi...",
}: Props) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const canSend = value.trim().length > 0 && !disabled;

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [value]);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="px-4 py-3 border-t border-gray-100 bg-white">
      <div
        className={`flex items-end gap-2 bg-gray-50 rounded-2xl border-2 transition-all duration-200 ${
          canSend
            ? "border-orange-400 shadow-[0_0_0_3px_rgba(249,115,22,0.08)]"
            : "border-gray-200"
        }`}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          maxLength={1000}
          rows={1}
          className="flex-1 resize-none bg-transparent px-4 py-3 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed max-h-[120px] overflow-y-auto leading-relaxed"
        />
        <button
          onClick={handleSend}
          disabled={!canSend}
          className={`m-2 w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
            canSend
              ? "bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-200 hover:scale-105 active:scale-95"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          <ArrowUp className="w-4 h-4" strokeWidth={2.5} />
        </button>
      </div>
      <p className="text-[10px] text-gray-300 text-center mt-1.5">
        Enter để gửi · Shift+Enter xuống dòng
      </p>
    </div>
  );
}
