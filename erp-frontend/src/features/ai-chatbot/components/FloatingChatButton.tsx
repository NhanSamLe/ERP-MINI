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
      <button
        onClick={() => dispatch(togglePanel())}
        className={`relative w-14 h-14 rounded-2xl text-white shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 ${
          isOpen
            ? "bg-gray-600 shadow-gray-300/50"
            : "bg-gradient-to-br from-orange-500 to-orange-600 shadow-orange-300/60 hover:shadow-orange-400/70"
        }`}
        title="Trợ lý AI"
      >
        {!isOpen && (
          <span className="absolute inset-0 rounded-2xl bg-orange-500 animate-ping opacity-20" />
        )}

        {isOpen ? (
          <X className="w-5 h-5" strokeWidth={2.5} />
        ) : (
          <Bot className="w-6 h-6" />
        )}

        {!isOpen && (
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white shadow-sm" />
        )}
      </button>

      <ChatPanel />
    </>
  );
}
