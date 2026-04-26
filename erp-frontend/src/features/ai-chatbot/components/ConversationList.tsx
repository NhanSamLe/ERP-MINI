import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../store/store";
import {
  setActiveConversation,
  fetchMessagesThunk,
  createConversationThunk,
} from "../store/chatSlice";
import { Conversation } from "../types/chat.types";
import { Plus, MessageSquare } from "lucide-react";

export default function ConversationList() {
  const dispatch = useDispatch<AppDispatch>();
  const { conversations, activeConversationId } = useSelector(
    (state: RootState) => state.chat,
  );

  const handleSelect = (conv: Conversation) => {
    dispatch(setActiveConversation(conv.id));
    dispatch(fetchMessagesThunk(conv.id));
  };

  const handleNewChat = async () => {
    await dispatch(createConversationThunk());
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/80">
      {/* New chat button */}
      <div className="p-2.5">
        <button
          onClick={handleNewChat}
          className="w-full flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-[11px] font-semibold tracking-wide transition-all duration-200 shadow-sm shadow-indigo-200 hover:shadow-indigo-300 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-3 h-3" strokeWidth={2.5} />
          Mới
        </button>
      </div>

      <div className="px-1.5 pb-1">
        <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-1.5 py-1 space-y-0.5 scrollbar-thin">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 gap-2">
            <MessageSquare className="w-6 h-6 text-slate-300" />
            <p className="text-[10px] text-slate-400 text-center leading-relaxed">
              Chưa có cuộc trò chuyện
            </p>
          </div>
        ) : (
          conversations.map((conv) => {
            const displayTitle = conv.title?.trim() || "Cuộc trò chuyện mới";
            const isActive = conv.id === activeConversationId;
            return (
              <button
                key={conv.id}
                onClick={() => handleSelect(conv)}
                title={displayTitle}
                className={`w-full flex items-center gap-1.5 px-2 py-2 text-left rounded-xl transition-all duration-150 group ${
                  isActive
                    ? "bg-indigo-100 text-indigo-800"
                    : "text-slate-600 hover:bg-white hover:shadow-sm"
                }`}
              >
                <MessageSquare
                  className={`w-3 h-3 flex-shrink-0 transition-colors ${
                    isActive
                      ? "text-indigo-500"
                      : "text-slate-400 group-hover:text-slate-500"
                  }`}
                />
                <span
                  className={`truncate text-[11px] leading-snug ${
                    isActive ? "font-semibold" : "font-normal"
                  }`}
                >
                  {displayTitle}
                </span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
