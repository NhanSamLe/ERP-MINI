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
        className={`fixed bottom-5 right-5 z-40 w-12 h-12 rounded-lg text-white shadow-lg flex items-center justify-center transition-all duration-150 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
          isOpen ? "bg-gray-600 hover:bg-gray-700" : "bg-orange-500 hover:bg-orange-600"
        }`}
        title="Trợ lý AI"
        aria-label="Trợ lý AI"
      >
        {isOpen ? (
          <X className="w-5 h-5" strokeWidth={2.5} />
        ) : (
          <Bot className="w-5 h-5" />
        )}

        {!isOpen && (
          <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
          </span>
        )}
      </button>

      <ChatPanel />
    </>
  );
}
