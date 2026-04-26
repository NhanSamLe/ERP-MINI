import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../store/store";
import {
  closePanel,
  sendMessageThunk,
  fetchMessagesThunk,
  fetchConversationsThunk,
  createConversationThunk,
} from "../store/chatSlice";
import MessageBubble, { LoadingBubble } from "./MessageBubble";
import ChatInput from "./ChatInput";
import ConversationList from "./ConversationList";
import { X, Bot } from "lucide-react";

export default function ChatPanel() {
  const dispatch = useDispatch<AppDispatch>();
  const { messages, isLoading, activeConversationId, isOpen } = useSelector(
    (state: RootState) => state.chat,
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations khi panel mở
  useEffect(() => {
    if (isOpen) {
      dispatch(fetchConversationsThunk());
    }
  }, [isOpen, dispatch]);

  // Auto-scroll xuống tin nhắn mới nhất
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async (content: string) => {
    let convId = activeConversationId;

    // Tạo conversation mới nếu chưa có
    if (!convId) {
      const result = await dispatch(createConversationThunk()).unwrap();
      convId = result.id;
    }

    // Gửi và chờ backend xử lý LLM xong hoàn toàn
    try {
      const result = await dispatch(
        sendMessageThunk({ conversationId: convId, content }),
      ).unwrap();
      console.log("[ChatPanel] sendMessage OK:", result);
    } catch (err: unknown) {
      // err là string từ rejectWithValue(getErrorMessage(...))
      console.error("[ChatPanel] sendMessage ERROR:", err);
    }
    // Fetch lại toàn bộ messages
    console.log("[ChatPanel] fetching messages for conv:", convId);
    const fetchResult = await dispatch(fetchMessagesThunk(convId));
    console.log("[ChatPanel] fetchMessages result:", fetchResult);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-20 right-6 w-[380px] h-[560px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-indigo-600 text-white">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          <span className="font-semibold text-sm">ERP Assistant</span>
        </div>
        <button
          onClick={() => dispatch(closePanel())}
          className="hover:bg-indigo-700 rounded-lg p-1 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body: sidebar + messages */}
      <div className="flex flex-1 overflow-hidden">
        {/* Conversation sidebar */}
        <div className="w-[130px] border-r border-gray-100 overflow-hidden flex-shrink-0">
          <ConversationList />
        </div>

        {/* Messages area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {messages.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 text-xs gap-2 py-8">
                <Bot className="w-8 h-8 opacity-30" />
                <p>Xin chào! Tôi có thể giúp bạn tra cứu dữ liệu ERP.</p>
                <p className="text-gray-300">
                  Ví dụ: "Tồn kho iPhone 15 còn bao nhiêu?"
                </p>
              </div>
            )}
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {isLoading && <LoadingBubble />}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <ChatInput onSend={handleSend} disabled={isLoading} />
        </div>
      </div>
    </div>
  );
}
