import { ChatMessage } from "../types/chat.types";
import { Bot, User } from "lucide-react";

interface Props {
  message: ChatMessage;
}

export default function MessageBubble({ message }: Props) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex gap-2.5 items-end animate-in fade-in slide-in-from-bottom-2 duration-300 ${
        isUser ? "flex-row-reverse" : "flex-row"
      }`}
    >
      {/* Avatar */}
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mb-0.5 ring-2 ${
          isUser
            ? "bg-gradient-to-br from-amber-400 to-orange-500 ring-orange-300/30"
            : "bg-gradient-to-br from-violet-500 to-indigo-600 ring-indigo-400/30"
        }`}
      >
        {isUser ? (
          <User className="w-3 h-3 text-white" />
        ) : (
          <Bot className="w-3 h-3 text-white" />
        )}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[72%] px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap break-words shadow-sm ${
          isUser
            ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-2xl rounded-br-md"
            : "bg-white/80 backdrop-blur-sm text-slate-700 rounded-2xl rounded-bl-md border border-slate-100"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}

export function LoadingBubble() {
  return (
    <div className="flex gap-2.5 items-end animate-in fade-in duration-200">
      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0 ring-2 ring-indigo-400/30">
        <Bot className="w-3 h-3 text-white" />
      </div>
      <div className="bg-white/80 backdrop-blur-sm border border-slate-100 px-4 py-3 rounded-2xl rounded-bl-md shadow-sm">
        <div className="flex gap-1.5 items-center h-3">
          <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0ms] [animation-duration:1s]" />
          <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:180ms] [animation-duration:1s]" />
          <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:360ms] [animation-duration:1s]" />
        </div>
      </div>
    </div>
  );
}
