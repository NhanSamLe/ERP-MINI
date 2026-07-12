import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { LocalChatMessage, ERPModule } from "../types/local-rag.types";
import {
  sendLocalMessageThunk,
  fetchConversationsThunk,
  createConversationThunk,
  loadConversationMessagesThunk,
} from "./localRagThunks";

interface LocalConversation {
  id: number;
  title: string | null;
  updated_at?: string;
}

interface LocalRagState {
  isOpen: boolean;
  messages: LocalChatMessage[];
  isLoading: boolean;
  error: string | null;
  selectedModule: ERPModule | 'all';
  conversations: LocalConversation[];
  activeConversationId: number | null;
}

const initialState: LocalRagState = {
  isOpen: false,
  messages: [],
  isLoading: false,
  error: null,
  selectedModule: 'all',
  conversations: [],
  activeConversationId: null,
};

// ─── Slice ────────────────────────────────────────────────────────────────────

const localRagSlice = createSlice({
  name: "localRag",
  initialState,
  reducers: {
    togglePanel(state) {
      state.isOpen = !state.isOpen;
    },
    openPanel(state) {
      state.isOpen = true;
    },
    closePanel(state) {
      state.isOpen = false;
    },
    setSelectedModule(state, action: PayloadAction<ERPModule | 'all'>) {
      state.selectedModule = action.payload;
    },
    clearChat(state) {
      state.messages = [];
      state.activeConversationId = null;
    },
    setActiveConversationId(state, action: PayloadAction<number | null>) {
      state.activeConversationId = action.payload;
    },
    addOptimisticMessage(state, action: PayloadAction<LocalChatMessage>) {
      state.messages.push(action.payload);
    },
    startStreaming(state, action: PayloadAction<{ userMessage: string }>) {
      state.isLoading = true;
      state.error = null;
      state.messages.push({
        role: "user",
        content: action.payload.userMessage,
      });
      state.messages.push({
        role: "assistant",
        content: "",
        sources: [],
      });
    },
    appendStreamChunk(state, action: PayloadAction<string>) {
      const lastMsg = state.messages[state.messages.length - 1];
      if (lastMsg && lastMsg.role === "assistant") {
        lastMsg.content += action.payload;
      }
    },
    setSources(state, action: PayloadAction<any[]>) {
      const lastMsg = state.messages[state.messages.length - 1];
      if (lastMsg && lastMsg.role === "assistant") {
        lastMsg.sources = action.payload;
      }
    },
    endStreaming(state) {
      state.isLoading = false;
      // Trích xuất tiêu đề nếu cuộc hội thoại hiện tại chưa có tiêu đề
      if (state.activeConversationId) {
        const currentConv = state.conversations.find(c => c.id === state.activeConversationId);
        if (currentConv && !currentConv.title && state.messages.length > 0) {
          const firstUserMsg = state.messages.find(m => m.role === "user");
          if (firstUserMsg) {
            currentConv.title = firstUserMsg.content.slice(0, 80);
          }
        }
      }
    },
    setError(state, action: PayloadAction<string>) {
      state.isLoading = false;
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendLocalMessageThunk.pending, (s) => {
        s.isLoading = true;
        s.error = null;
      })
      .addCase(sendLocalMessageThunk.fulfilled, (s, a) => {
        s.isLoading = false;
        s.error = null;
        s.messages.push({
          role: "assistant",
          content: a.payload.answer,
          sources: a.payload.sources,
        });
      })
      .addCase(sendLocalMessageThunk.rejected, (s, a) => {
        s.isLoading = false;
        s.error = a.payload as string;
      })
      // Fetch Conversations
      .addCase(fetchConversationsThunk.pending, (s) => {
        s.isLoading = true;
      })
      .addCase(fetchConversationsThunk.fulfilled, (s, a) => {
        s.isLoading = false;
        s.conversations = a.payload;
      })
      .addCase(fetchConversationsThunk.rejected, (s, a) => {
        s.isLoading = false;
        s.error = a.payload as string;
      })
      // Create Conversation
      .addCase(createConversationThunk.pending, (s) => {
        s.isLoading = true;
      })
      .addCase(createConversationThunk.fulfilled, (s, a) => {
        s.isLoading = false;
        s.conversations.unshift(a.payload);
        s.activeConversationId = a.payload.id;
        s.messages = [];
      })
      .addCase(createConversationThunk.rejected, (s, a) => {
        s.isLoading = false;
        s.error = a.payload as string;
      })
      // Load Messages
      .addCase(loadConversationMessagesThunk.pending, (s) => {
        s.isLoading = true;
        s.messages = [];
      })
      .addCase(loadConversationMessagesThunk.fulfilled, (s, a) => {
        s.isLoading = false;
        s.messages = a.payload.map((m: any) => ({
          role: m.role,
          content: m.content,
          sources: m.sources || [],
        }));
      })
      .addCase(loadConversationMessagesThunk.rejected, (s, a) => {
        s.isLoading = false;
        s.error = a.payload as string;
      })
      // Clear local RAG state on logout
      .addCase("auth/clearAuth", () => {
        return initialState;
      });
  },
});

export const {
  togglePanel,
  openPanel,
  closePanel,
  setSelectedModule,
  clearChat,
  setActiveConversationId,
  addOptimisticMessage,
  startStreaming,
  appendStreamChunk,
  setSources,
  endStreaming,
  setError,
} = localRagSlice.actions;

export const localRagReducer = localRagSlice.reducer;
