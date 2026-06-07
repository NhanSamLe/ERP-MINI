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
    <div className="fixed bottom-[88px] left-[272px] w-[480px] max-h-[calc(100vh-120px)] h-[640px] flex flex-col rounded-2xl overflow-hidden z-50 shadow-2xl shadow-orange-200/30 border border-gray-200 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Background */}
      <div className="absolute inset-0 bg-white pointer-events-none" />

      <div className="relative flex flex-col h-full">
        {/* Header — orange gradient */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 flex-shrink-0 border-b-2 border-orange-600">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/30">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white text-sm tracking-tight">
                  ERP Assistant
                </span>
                <Sparkles className="w-3.5 h-3.5 text-orange-200" />
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[11px] text-orange-100 font-medium">
                  Trợ lý AI · Đang hoạt động
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => dispatch(closePanel())}
            className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-all duration-150 hover:scale-105 active:scale-95"
          >
            <X className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Conversation sidebar */}
          <div className="w-[140px] border-r border-gray-100 flex-shrink-0 overflow-hidden bg-gray-50">
            <ConversationList />
          </div>

          {/* Messages area */}
          <div className="flex-1 flex flex-col overflow-hidden bg-white">
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.length === 0 && !isLoading && (
                <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-8">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center ring-2 ring-orange-100">
                    <Bot className="w-7 h-7 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700">
                      Xin chào! 👋
                    </p>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed max-w-[200px]">
                      Tôi có thể tra cứu dữ liệu ERP hoặc giúp bạn tạo đơn hàng.
                    </p>
                  </div>
                  <div className="bg-orange-50 border border-orange-100 rounded-xl px-4 py-2.5">
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
    </div>
  );
}
