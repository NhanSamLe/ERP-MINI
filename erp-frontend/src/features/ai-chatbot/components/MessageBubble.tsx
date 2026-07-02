import { ChatMessage } from "../types/chat.types";
import { Bot, User, CheckCircle, XCircle, Bell } from "lucide-react";

interface Props {
  message: ChatMessage;
  onConfirm?: (reply: string) => void;
}

function isConfirmationMessage(content: string): boolean {
  return content.includes("🔔 **Xác nhận thao tác**");
}

function parseConfirmationContent(content: string): { description: string } {
  const lines = content.split("\n");
  const descLines = lines
    .slice(2)
    .filter(
      (l) =>
        !l.startsWith("Bạn có muốn") && !l.startsWith("_Yêu cầu") && l.trim(),
    );
  return { description: descLines.join("\n") };
}

/** Render markdown bold (**text**) và italic (_text_) */
function renderMarkdown(text: string): React.ReactNode {
  // Split by bold (**text**) and italic (_text_)
  const parts = text.split(/(\*\*[^*]+\*\*|_[^_]+_)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("_") && part.endsWith("_")) {
      return (
        <em key={i} className="italic text-gray-400">
          {part.slice(1, -1)}
        </em>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export default function MessageBubble({ message, onConfirm }: Props) {
  const isUser = message.role === "user";
  const isConfirmation =
    !isUser && isConfirmationMessage(message.content ?? "");

  return (
    <div
      className={`flex gap-2 items-end animate-in fade-in slide-in-from-bottom-1 duration-150 ${
        isUser ? "flex-row-reverse" : "flex-row"
      }`}
    >
      {/* Avatar */}
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mb-0.5 ${
          isUser
            ? "bg-orange-500"
            : "bg-orange-50 border border-orange-200"
        }`}
      >
        {isUser ? (
          <User className="w-3 h-3 text-white" />
        ) : (
          <Bot className="w-3 h-3 text-orange-500" />
        )}
      </div>

      {/* Bubble */}
      {isConfirmation && onConfirm ? (
        <ConfirmationCard
          content={message.content ?? ""}
          onConfirm={onConfirm}
        />
      ) : (
        <div
          className={`max-w-[74%] px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words rounded-lg ${
            isUser
              ? "bg-orange-500 text-white"
              : "bg-gray-50 text-gray-700 border border-gray-100"
          }`}
        >
          {renderMarkdown(message.content ?? "")}
        </div>
      )}
    </div>
  );
}

function ConfirmationCard({
  content,
  onConfirm,
}: {
  content: string;
  onConfirm: (reply: string) => void;
}) {
  const { description } = parseConfirmationContent(content);

  return (
    <div className="max-w-[82%] rounded-lg border border-orange-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-orange-500 px-3.5 py-2 flex items-center gap-2">
        <Bell className="w-3.5 h-3.5 text-white" />
        <span className="text-white text-sm font-semibold">
          Xác nhận thao tác
        </span>
      </div>

      {/* Description */}
      <div className="px-3.5 py-3">
        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
          {renderMarkdown(description)}
        </p>
        <p className="text-[11px] text-gray-400 mt-2 italic">
          Yêu cầu hết hạn sau 10 phút
        </p>
      </div>

      {/* Actions */}
      <div className="px-3.5 pb-3.5 flex gap-2">
        <button
          onClick={() => onConfirm("đồng ý")}
          className="flex items-center gap-1.5 h-8 px-3 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-md transition-colors active:scale-[0.98]"
        >
          <CheckCircle className="w-3.5 h-3.5" />
          Xác nhận
        </button>
        <button
          onClick={() => onConfirm("hủy")}
          className="flex items-center gap-1.5 h-8 px-3 bg-white hover:bg-gray-50 text-gray-600 text-sm font-medium rounded-md border border-gray-300 transition-colors active:scale-[0.98]"
        >
          <XCircle className="w-3.5 h-3.5" />
          Hủy
        </button>
      </div>
    </div>
  );
}

export function LoadingBubble() {
  return (
    <div className="flex gap-2 items-end animate-in fade-in duration-150">
      <div className="w-6 h-6 rounded-full bg-orange-50 border border-orange-200 flex items-center justify-center flex-shrink-0">
        <Bot className="w-3 h-3 text-orange-500" />
      </div>
      <div className="bg-gray-50 border border-gray-100 px-3.5 py-2.5 rounded-lg">
        <div className="flex gap-1.5 items-center h-4">
          <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce [animation-delay:0ms] [animation-duration:1s]" />
          <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce [animation-delay:180ms] [animation-duration:1s]" />
          <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce [animation-delay:360ms] [animation-duration:1s]" />
        </div>
      </div>
    </div>
  );
}
