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
    <div className="flex flex-col h-full">
      {/* New chat button */}
      <div className="p-2.5">
        <button
          onClick={handleNewChat}
          className="w-full flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-bold tracking-wide transition-all duration-200 shadow-sm hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={3} />
          Mới
        </button>
      </div>

      <div className="px-2 pb-1">
        <div className="h-px bg-gray-200" />
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto px-1.5 py-1 space-y-0.5">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 gap-2">
            <MessageSquare className="w-5 h-5 text-gray-300" />
            <p className="text-[10px] text-gray-400 text-center leading-relaxed px-2">
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
                    ? "bg-orange-50 text-orange-700 border border-orange-200"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                }`}
              >
                <MessageSquare
                  className={`w-3 h-3 flex-shrink-0 ${
                    isActive ? "text-orange-500" : "text-gray-400"
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
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-500 flex-shrink-0" />
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
