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

    // Optimistic update — hiện user message ngay lập tức
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
    // Fetch lại để có cả AI reply
    await dispatch(fetchMessagesThunk(convId));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-[88px] left-[272px] w-[400px] h-[580px] flex flex-col rounded-2xl overflow-hidden z-50 shadow-2xl shadow-indigo-200/40 border border-white/60 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Glassmorphism background */}
      <div className="absolute inset-0 bg-white/95 backdrop-blur-xl pointer-events-none" />

      {/* Content */}
      <div className="relative flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 flex-shrink-0">
          {/* Subtle noise texture overlay */}
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iLjc1IiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWx0ZXI9InVybCgjYSkiIG9wYWNpdHk9IjAuMDUiLz48L3N2Zz4=')]" />

          <div className="relative flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/30">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-white text-sm tracking-tight">
                  ERP Assistant
                </span>
                <Sparkles className="w-3 h-3 text-amber-300" />
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] text-white/70 font-medium">
                  Online
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => dispatch(closePanel())}
            className="relative w-7 h-7 rounded-xl bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-all duration-150 hover:scale-105 active:scale-95"
          >
            <X className="w-3.5 h-3.5" strokeWidth={2.5} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-[120px] border-r border-slate-100 flex-shrink-0 overflow-hidden">
            <ConversationList />
          </div>

          {/* Messages */}
          <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-b from-slate-50/50 to-white/80">
            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
              {messages.length === 0 && !isLoading && (
                <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-8">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center">
                    <Bot className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-slate-600">
                      Xin chào! 👋
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Tôi có thể giúp bạn tra cứu dữ liệu ERP.
                    </p>
                  </div>
                  <div className="bg-slate-100 rounded-xl px-3 py-2 max-w-[160px]">
                    <p className="text-[10px] text-slate-500 italic leading-relaxed">
                      "Tồn kho iPhone 15 còn bao nhiêu?"
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
                  <MessageBubble key={msg.id} message={msg} />
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
