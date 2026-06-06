import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../store/store";
import { togglePanel } from "../store/chatSlice";
import ChatPanel from "./ChatPanel";
import { Bot, X } from "lucide-react";

export default function FloatingChatButton() {
  const dispatch = useDispatch<AppDispatch>();
  const isOpen = useSelector((state: RootState) => state.chat.isOpen);

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => dispatch(togglePanel())}
        className={`relative w-14 h-14 rounded-2xl text-white shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 ${
          isOpen
            ? "bg-slate-700 shadow-slate-300/50 rotate-0"
            : "bg-gradient-to-br from-indigo-500 to-violet-600 shadow-indigo-300/60 hover:shadow-indigo-400/70"
        }`}
        title="Trợ lý AI"
      >
        {/* Ping animation when closed */}
        {!isOpen && (
          <span className="absolute inset-0 rounded-2xl bg-indigo-500 animate-ping opacity-20" />
        )}

        <span
          className={`transition-all duration-300 ${isOpen ? "rotate-0 scale-100" : "rotate-0 scale-100"}`}
        >
          {isOpen ? (
            <X className="w-5 h-5" strokeWidth={2.5} />
          ) : (
            <Bot className="w-6 h-6" />
          )}
        </span>

        {/* Notification dot */}
        {!isOpen && (
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white shadow-sm" />
        )}
      </button>

      <ChatPanel />
    </>
  );
}
