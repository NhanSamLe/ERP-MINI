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
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg flex items-center justify-center z-50 transition-all hover:scale-105 active:scale-95"
        title="Trợ lý AI"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
      </button>

      {/* Chat panel */}
      <ChatPanel />
    </>
  );
}
