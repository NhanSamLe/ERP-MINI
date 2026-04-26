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
      <div className="p-3 border-b border-gray-100">
        <button
          onClick={handleNewChat}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-medium transition"
        >
          <Plus className="w-4 h-4" />
          Cuộc trò chuyện mới
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto py-1">
        {conversations.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4 italic">
            Chưa có cuộc trò chuyện nào
          </p>
        ) : (
          conversations.map((conv) => {
            const displayTitle = conv.title?.trim() || "Cuộc trò chuyện mới";
            const isActive = conv.id === activeConversationId;
            return (
              <button
                key={conv.id}
                onClick={() => handleSelect(conv)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm rounded-lg mx-1 transition ${
                  isActive
                    ? "bg-indigo-100 text-indigo-800 font-medium"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
                <span className="truncate">{displayTitle}</span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
