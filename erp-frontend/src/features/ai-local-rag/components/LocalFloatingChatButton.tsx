import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../store/store";
import { togglePanel } from "../store/localRagSlice";
import LocalChatPanel from "./LocalChatPanel";
import { Cpu, X } from "lucide-react";

export default function LocalFloatingChatButton() {
  const dispatch = useDispatch<AppDispatch>();
  const isOpen = useSelector((state: RootState) => state.localRag.isOpen);

  return (
    <>
      {/* Floating button for Local RAG */}
      <button
        onClick={() => dispatch(togglePanel())}
        className={`relative w-14 h-14 rounded-2xl text-white shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 ${
          isOpen
            ? "bg-slate-700 shadow-slate-300/50 rotate-0"
            : "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-200/60 hover:shadow-emerald-300/70"
        }`}
        title="Trợ lý AI Nội bộ (Ollama)"
      >
        {/* Ping animation when closed */}
        {!isOpen && (
          <span className="absolute inset-0 rounded-2xl bg-emerald-500 animate-ping opacity-20" />
        )}

        <span
          className={`transition-all duration-300 ${isOpen ? "rotate-0 scale-100" : "rotate-0 scale-100"}`}
        >
          {isOpen ? (
            <X className="w-5 h-5" strokeWidth={2.5} />
          ) : (
            <Cpu className="w-6 h-6 text-white" />
          )}
        </span>

        {/* Tiny CPU/AI indicator dot */}
        {!isOpen && (
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-teal-400 rounded-full border-2 border-white shadow-sm" />
        )}
      </button>

      <LocalChatPanel />
    </>
  );
}
