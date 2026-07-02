import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../store/store";
import {
  closePanel,
  sendMessageThunk,
  fetchMessagesThunk,
  fetchConversationsThunk,
  createConversationThunk,
  setActiveConversation,
  addOptimisticMessage,
} from "../store/chatSlice";
import MessageBubble, { LoadingBubble } from "./MessageBubble";
import ChatInput from "./ChatInput";
import ConversationList from "./ConversationList";
import { X, Bot, Sparkles } from "lucide-react";

export default function ChatPanel() {
  const dispatch = useDispatch<AppDispatch>();
  const { messages, isLoading, activeConversationId, isOpen } = useSelector(
    (state: RootState) => state.chat,
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchConversationsThunk()).then((result) => {
        if (fetchConversationsThunk.fulfilled.match(result)) {
          const convs = result.payload;
          if (convs.length > 0 && !activeConversationId) {
            dispatch(setActiveConversation(convs[0].id));
            dispatch(fetchMessagesThunk(convs[0].id));
          }
        }
      });
    }
  }, [isOpen, dispatch]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async (content: string) => {
    let convId = activeConversationId;
    if (!convId) {
      const result = await dispatch(createConversationThunk()).unwrap();
      convId = result.id;
    }

    dispatch(
      addOptimisticMessage({
        id: Date.now(),
        conversation_id: convId,
        role: "user",
        content,
        created_at: new Date().toISOString(),
      }),
    );

    try {
      await dispatch(
        sendMessageThunk({ conversationId: convId, content }),
      ).unwrap();
    } catch (err) {
      console.error("[ChatPanel] sendMessage ERROR:", err);
    }
    await dispatch(fetchMessagesThunk(convId));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-[76px] left-[272px] w-[440px] max-h-[calc(100vh-104px)] h-[600px] flex flex-col rounded-lg overflow-hidden z-50 shadow-lg border border-gray-200 bg-white animate-in fade-in slide-in-from-bottom-2 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-orange-500 flex-shrink-0 border-b border-orange-600">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-white text-sm">
                ERP Assistant
              </span>
              <Sparkles className="w-3 h-3 text-orange-100" />
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
              <span className="text-[11px] text-orange-50">
                Trợ lý AI · Đang hoạt động
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => dispatch(closePanel())}
          className="w-7 h-7 rounded-md hover:bg-white/15 text-white flex items-center justify-center transition-colors duration-150"
        >
          <X className="w-4 h-4" strokeWidth={2.5} />
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Conversation sidebar */}
        <div className="w-[130px] border-r border-gray-200 flex-shrink-0 overflow-hidden bg-gray-50">
          <ConversationList />
        </div>

        {/* Messages area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-8">
                <div className="w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center border border-orange-100">
                  <Bot className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">
                    Xin chào!
                  </p>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed max-w-[200px]">
                    Tôi có thể tra cứu dữ liệu ERP hoặc giúp bạn tạo đơn hàng.
                  </p>
                </div>
                <div className="bg-orange-50 border border-orange-100 rounded-md px-3 py-2">
                  <p className="text-[11px] text-orange-600 italic leading-relaxed">
                    "Tạo đơn mua iPhone 15 từ ABC Supplies"
                  </p>
                </div>
              </div>
            )}

            {messages
              .filter(
                (msg) =>
                  msg.role === "user" ||
                  (msg.role === "assistant" && msg.content?.trim()),
              )
              .map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  onConfirm={(reply) => handleSend(reply)}
                />
              ))}

            {isLoading && <LoadingBubble />}
            <div ref={messagesEndRef} />
          </div>

          <ChatInput onSend={handleSend} disabled={isLoading} />
        </div>
      </div>
    </div>
  );
}
