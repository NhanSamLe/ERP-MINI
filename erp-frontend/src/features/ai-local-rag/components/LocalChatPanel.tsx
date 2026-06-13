import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../store/store";
import {
  closePanel,
  setSelectedModule,
  clearChat,
  startStreaming,
  appendStreamChunk,
  setSources,
  endStreaming,
  setError,
  setActiveConversationId,
} from "../store/localRagSlice";
import {
  X,
  Sparkles,
  Send,
  RefreshCw,
  Layers,
  User,
  Bot,
  Plus,
  MessageSquare,
  ChevronLeft,
} from "lucide-react";
import type { ERPModule, SearchSource } from "../types/local-rag.types";
import {
  fetchConversationsThunk,
  createConversationThunk,
  loadConversationMessagesThunk,
} from "../store/localRagThunks";

export default function LocalChatPanel() {
  const dispatch = useDispatch<AppDispatch>();
  const {
    messages,
    isLoading,
    selectedModule,
    isOpen,
    error,
    conversations,
    activeConversationId,
  } = useSelector((state: RootState) => state.localRag);
  const accessToken = useSelector(
    (state: RootState) => (state as any).auth?.accessToken,
  );
  const [input, setInput] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchConversationsThunk());
    }
  }, [isOpen, dispatch]);

  const handleSyncVectorDb = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const baseUrl =
        import.meta.env.VITE_API_URL || "http://localhost:8888/api";
      const response = await fetch(`${baseUrl}/ai/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      });

      if (!response.ok) {
        throw new Error(`Sync thất bại với status: ${response.status}`);
      }

      await response.json();
      alert("Đồng bộ dữ liệu Vector DB thành công!");
    } catch (err: any) {
      console.error("[LocalChatPanel] sync ERROR:", err);
      alert(`Lỗi đồng bộ: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const currentInput = input;
    setInput("");

    let convId = activeConversationId;
    try {
      if (!convId) {
        const newConv = await dispatch(
          createConversationThunk(currentInput.slice(0, 50)),
        ).unwrap();
        convId = newConv.id;
      }

      // Initialize streaming message structure
      dispatch(startStreaming({ userMessage: currentInput }));

      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const payload = {
        message: currentInput,
        module: selectedModule === "all" ? undefined : selectedModule,
        history,
        conversationId: convId,
      };

      const baseUrl =
        import.meta.env.VITE_API_URL || "http://localhost:8888/api";
      const response = await fetch(`${baseUrl}/ai/chat/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No readable stream in response");
      }

      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep trailing chunk in buffer

        for (const line of lines) {
          const cleanedLine = line.trim();
          if (!cleanedLine) continue;

          if (cleanedLine.startsWith("data: ")) {
            const dataStr = cleanedLine.replace("data: ", "").trim();
            if (dataStr === "[DONE]") {
              continue;
            }

            try {
              const dataObj = JSON.parse(dataStr);
              if (dataObj.chunk) {
                dispatch(appendStreamChunk(dataObj.chunk));
              } else if (dataObj.sources) {
                dispatch(setSources(dataObj.sources));
              } else if (dataObj.error) {
                dispatch(setError(dataObj.error));
              }
            } catch (e) {
              console.error("Failed to parse SSE data chunk:", e);
            }
          }
        }
      }

      dispatch(endStreaming());
      // Refresh conversation list to get latest titles
      dispatch(fetchConversationsThunk());
    } catch (err: any) {
      console.error("[LocalChatPanel] sendLocalMessage ERROR:", err);
      dispatch(setError(err.message || "Failed to fetch stream"));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startNewChat = () => {
    dispatch(clearChat());
    setShowHistory(false);
  };

  const handleSelectConversation = (id: number) => {
    dispatch(setActiveConversationId(id));
    dispatch(loadConversationMessagesThunk(id));
    setShowHistory(false);
  };

  if (!isOpen) return null;

  const MODULE_TABS: { value: ERPModule | "all"; label: string }[] = [
    { value: "all", label: "Tất cả" },
    { value: "crm", label: "CRM" },
    { value: "purchase", label: "Mua hàng" },
    { value: "sale", label: "Bán hàng" },
    { value: "inventory", label: "Kho hàng" },
  ];

  return (
    <div className="fixed bottom-[88px] left-[272px] w-[420px] h-[580px] flex flex-col rounded-2xl overflow-hidden z-50 shadow-2xl shadow-emerald-100/30 border border-white/60 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Glassmorphism background */}
      <div className="absolute inset-0 bg-white/95 backdrop-blur-xl pointer-events-none" />

      {/* Content */}
      <div className="relative flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 flex-shrink-0 z-45">
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iLjc1IiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWx0ZXI9InVybCgjYSkiIG9wYWNpdHk9IjAuMDUiLz48L3N2Zz4=')]" />

          <div className="relative flex items-center gap-2">
            <button
              onClick={handleSyncVectorDb}
              disabled={isSyncing}
              className="w-7 h-7 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/30 transition-all cursor-pointer active:scale-95 disabled:opacity-40"
              title="Đồng bộ CSDL Vector (Sync RAG)"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-white ${isSyncing ? "animate-spin" : "animate-spin-slow"}`}
              />
            </button>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-semibold text-white text-xs tracking-tight">
                  AI Nội bộ
                </span>
                <Sparkles className="w-2.5 h-2.5 text-amber-300" />
              </div>
              <div className="flex items-center gap-0.5 mt-0.5">
                <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[8px] text-white/70 font-medium">
                  CSDL Vector
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 z-50">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`relative px-2 py-1 rounded-lg text-white text-[10px] font-semibold transition-all flex items-center gap-1 ${
                showHistory ? "bg-white/25" : "bg-white/10 hover:bg-white/20"
              }`}
              title="Lịch sử cuộc trò chuyện"
            >
              <MessageSquare className="w-3 h-3" />
              Lịch sử
            </button>
            <button
              onClick={startNewChat}
              className="relative px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-semibold transition-all flex items-center gap-1"
              title="Đoạn chat mới"
            >
              <Plus className="w-3 h-3" />
              Mới
            </button>
            <button
              onClick={() => dispatch(closePanel())}
              className="relative w-7 h-7 rounded-xl bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-all duration-150 hover:scale-105 active:scale-95"
            >
              <X className="w-3.5 h-3.5" strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Sliding History Sidebar */}
        <div
          className={`absolute top-[48px] left-0 h-[calc(100%-48px)] w-[260px] bg-white/95 backdrop-blur-md border-r border-slate-100 shadow-2xl z-40 flex flex-col transition-all duration-300 ${
            showHistory
              ? "translate-x-0 opacity-100"
              : "-translate-x-full opacity-0 pointer-events-none"
          }`}
        >
          {/* Sidebar Header */}
          <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <span className="font-bold text-slate-700 text-xs flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              Cuộc trò chuyện
            </span>
            <button
              onClick={startNewChat}
              className="flex items-center gap-0.5 px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-bold hover:bg-emerald-100 transition-colors"
            >
              <Plus className="w-2.5 h-2.5" />
              Tạo mới
            </button>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-slate-50/20">
            {conversations.length === 0 ? (
              <div className="text-center py-12 text-[11px] text-slate-400">
                Chưa có lịch sử trò chuyện
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv.id)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs flex flex-col gap-0.5 transition-all border ${
                    activeConversationId === conv.id
                      ? "bg-emerald-50/80 border-emerald-200/50 text-emerald-800 font-medium"
                      : "bg-white border-slate-100 hover:bg-slate-50 text-slate-600 hover:text-slate-800"
                  }`}
                >
                  <span className="truncate w-full text-[11px] font-medium">
                    {conv.title || "Cuộc hội thoại mới"}
                  </span>
                  <span className="text-[8px] text-slate-400 font-mono">
                    {conv.updated_at
                      ? new Date(conv.updated_at).toLocaleDateString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          day: "2-digit",
                          month: "2-digit",
                        })
                      : ""}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Module Filter Tabs */}
        <div className="flex gap-1 p-2 bg-slate-50/80 border-b border-slate-100 overflow-x-auto flex-shrink-0 z-10">
          {MODULE_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => dispatch(setSelectedModule(tab.value))}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedModule === tab.value
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-200"
                  : "bg-white text-slate-600 border border-slate-200/60 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Messages Body */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-b from-slate-50/50 to-white/80 z-10">
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-8">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center shadow-inner">
                  <Layers className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-slate-700">
                    Trợ lý Tri thức Cục bộ (RAG)
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed max-w-[280px] mx-auto">
                    Tôi có thể truy xuất dữ liệu ERP ngoại tuyến thời gian thực
                    từ Qdrant Vector DB thông qua mô hình Ollama.
                  </p>
                </div>
                <div className="bg-slate-100/80 rounded-xl px-3 py-2 border border-slate-200/40">
                  <p className="text-[10px] text-slate-500 italic">
                    "Kiểm tra thông tin sản phẩm iPhone 15"
                  </p>
                </div>
              </div>
            )}

            {messages.map((msg, idx) => {
              const isUser = msg.role === "user";
              // Skip rendering empty assistant message bubbles while streaming to avoid empty gray bubbles
              if (
                !isUser &&
                !msg.content &&
                isLoading &&
                idx === messages.length - 1
              ) {
                return null;
              }

              return (
                <div
                  key={idx}
                  className={`flex gap-2.5 items-end animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                    isUser ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mb-0.5 ring-2 ${
                      isUser
                        ? "bg-gradient-to-br from-amber-400 to-orange-500 ring-orange-300/30"
                        : "bg-gradient-to-br from-emerald-500 to-teal-600 ring-emerald-400/30"
                    }`}
                  >
                    {isUser ? (
                      <User className="w-3 h-3 text-white" />
                    ) : (
                      <Bot className="w-3 h-3 text-white" />
                    )}
                  </div>

                  {/* Bubble */}
                  <div
                    className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-xs shadow-sm leading-relaxed ${
                      isUser
                        ? "bg-emerald-600 text-white rounded-br-sm shadow-emerald-100"
                        : "bg-slate-100 text-slate-800 rounded-bl-sm border border-slate-200/50"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>

                    {/* Sources display for RAG — Chỉ hiện khi đã tải xong (isLoading = false) và sử dụng thẻ details/summary thu gọn */}
                    {msg.role === "assistant" &&
                      msg.sources &&
                      msg.sources.length > 0 &&
                      (!isLoading || idx !== messages.length - 1) && (
                        <details className="mt-3 group border-t border-slate-200/60 pt-2.5">
                          <summary className="list-none flex items-center justify-between text-[11px] font-bold text-slate-400 hover:text-emerald-700 cursor-pointer select-none py-1.5 px-2 bg-slate-200/30 hover:bg-emerald-50 rounded-xl transition-all duration-200">
                            <div className="flex items-center gap-1.5">
                              <Layers className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                              <span>
                                Nguồn dữ liệu tham chiếu ({msg.sources.length})
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 group-open:rotate-180 transition-transform duration-200">
                              ▼
                            </span>
                          </summary>

                          <div className="mt-2.5 space-y-1.5 max-h-[130px] overflow-y-auto pr-1 animate-in slide-in-from-top-2 duration-200">
                            {msg.sources.map(
                              (src: SearchSource, sIdx: number) => (
                                <div
                                  key={sIdx}
                                  className="text-[11px] bg-white rounded-lg p-2 border border-slate-200/80 shadow-2xs hover:border-emerald-300 transition-colors"
                                >
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="font-semibold text-emerald-700 capitalize">
                                      {src.entity_type === "purchase_order"
                                        ? "Đơn mua hàng"
                                        : src.entity_type === "sale_order"
                                          ? "Đơn bán hàng"
                                          : src.entity_type === "product"
                                            ? "Sản phẩm"
                                            : src.entity_type === "vendor"
                                              ? "Nhà cung cấp"
                                              : src.entity_type === "customer"
                                                ? "Khách hàng"
                                                : src.entity_type}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      Độ khớp: {(src.score * 100).toFixed(0)}%
                                    </span>
                                  </div>
                                  <p className="text-slate-500 font-mono text-[10px] whitespace-pre-wrap leading-normal">
                                    {src.content_text}
                                  </p>
                                </div>
                              ),
                            )}
                          </div>
                        </details>
                      )}
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex gap-2.5 items-end animate-in fade-in duration-200">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0 ring-2 ring-emerald-400/30">
                  <Bot className="w-3 h-3 text-white" />
                </div>
                <div className="bg-slate-100 rounded-2xl rounded-bl-sm px-4 py-3 border border-slate-200/50 shadow-sm">
                  <div className="flex gap-1.5 items-center">
                    <span
                      className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <span
                      className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <span
                      className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 text-center">
                Có lỗi xảy ra: {error}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input Area */}
          <div className="p-3 border-t border-slate-100 bg-white flex-shrink-0 z-10">
            <div className="flex gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Hỏi về khách hàng, hóa đơn, tồn kho..."
                rows={1}
                disabled={isLoading}
                className="flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-xs focus:outline-none focus:border-emerald-500 max-h-24 leading-relaxed bg-slate-50/50 focus:bg-white transition-colors"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-md shadow-emerald-100 hover:bg-emerald-700 disabled:opacity-40 transition-all flex-shrink-0 hover:scale-[1.03] active:scale-[0.97]"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
