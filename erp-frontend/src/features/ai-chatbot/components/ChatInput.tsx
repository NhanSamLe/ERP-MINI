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
    el.style.height = `${Math.min(el.scrollHeight, 112)}px`;
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
    <div className="px-3 py-2.5 border-t border-slate-100 bg-white/60 backdrop-blur-sm">
      <div
        className={`flex items-end gap-2 bg-slate-50 rounded-2xl border transition-all duration-200 ${
          canSend
            ? "border-indigo-300 shadow-[0_0_0_3px_rgba(99,102,241,0.08)]"
            : "border-slate-200"
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
          className="flex-1 resize-none bg-transparent px-3 py-2.5 text-[13px] text-slate-700 placeholder:text-slate-400 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed max-h-[112px] overflow-y-auto leading-relaxed"
        />
        <button
          onClick={handleSend}
          disabled={!canSend}
          className={`m-1.5 w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
            canSend
              ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-200 hover:shadow-indigo-300 hover:scale-105 active:scale-95"
              : "bg-slate-200 text-slate-400 cursor-not-allowed"
          }`}
        >
          <ArrowUp className="w-3.5 h-3.5" strokeWidth={2.5} />
        </button>
      </div>
      <p className="text-[10px] text-slate-300 text-center mt-1.5">
        Enter để gửi · Shift+Enter xuống dòng
      </p>
    </div>
  );
}
