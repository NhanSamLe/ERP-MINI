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
    <div className="px-3 py-2.5 border-t border-gray-200 bg-white">
      <div
        className={`flex items-end gap-2 bg-gray-50 rounded-md border transition-colors duration-150 ${
          canSend ? "border-orange-400" : "border-gray-200"
        } focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500`}
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
          className="flex-1 resize-none bg-transparent px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed max-h-[120px] overflow-y-auto leading-relaxed"
        />
        <button
          onClick={handleSend}
          disabled={!canSend}
          className={`m-1.5 w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 transition-colors duration-150 ${
            canSend
              ? "bg-orange-500 hover:bg-orange-600 text-white"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          <ArrowUp className="w-4 h-4" strokeWidth={2.5} />
        </button>
      </div>
      <p className="text-[10px] text-gray-400 text-center mt-1.5">
        Enter để gửi · Shift+Enter xuống dòng
      </p>
    </div>
  );
}
