import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { ChatMessage, Conversation } from "../types/chat.types";
import { chatApi } from "../api/chat.api";
import { getErrorMessage } from "../../../utils/ErrorHelper";

interface ChatState {
  isOpen: boolean;
  conversations: Conversation[];
  activeConversationId: number | null;
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
}

const initialState: ChatState = {
  isOpen: false,
  conversations: [],
  activeConversationId: null,
  messages: [],
  isLoading: false,
  error: null,
};

// ─── Thunks ──────────────────────────────────────────────────────────────────

export const fetchConversationsThunk = createAsyncThunk(
  "chat/fetchConversations",
  async (_, { rejectWithValue }) => {
    try {
      return await chatApi.getConversations();
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);

export const createConversationThunk = createAsyncThunk(
  "chat/createConversation",
  async (_, { rejectWithValue }) => {
    try {
      return await chatApi.createConversation();
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);

export const fetchMessagesThunk = createAsyncThunk(
  "chat/fetchMessages",
  async (conversationId: number, { rejectWithValue }) => {
    try {
      return await chatApi.getMessages(conversationId);
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);

export const sendMessageThunk = createAsyncThunk(
  "chat/sendMessage",
  async (
    { conversationId, content }: { conversationId: number; content: string },
    { rejectWithValue },
  ) => {
    try {
      return await chatApi.sendMessage(conversationId, { content });
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const chatSlice = createSlice({
  name: "chat",
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
    setActiveConversation(state, action: PayloadAction<number | null>) {
      state.activeConversationId = action.payload;
      if (!action.payload) state.messages = [];
    },
    clearMessages(state) {
      state.messages = [];
    },
    // Thêm user message tạm thời (optimistic update)
    addOptimisticMessage(state, action: PayloadAction<ChatMessage>) {
      state.messages.push(action.payload);
    },
  },
  extraReducers: (builder) => {
    // fetchConversations
    builder
      .addCase(fetchConversationsThunk.fulfilled, (s, a) => {
        s.conversations = a.payload;
      })

      // createConversation
      .addCase(createConversationThunk.fulfilled, (s, a) => {
        s.conversations.unshift(a.payload);
        s.activeConversationId = a.payload.id;
        s.messages = [];
      })

      // fetchMessages
      .addCase(fetchMessagesThunk.pending, (s) => {
        s.isLoading = true;
        s.error = null;
      })
      .addCase(fetchMessagesThunk.fulfilled, (s, a) => {
        s.isLoading = false;
        s.messages = a.payload;
      })
      .addCase(fetchMessagesThunk.rejected, (s, a) => {
        s.isLoading = false;
        s.error = a.payload as string;
      })

      // sendMessage — chỉ quản lý loading state, messages được fetch lại sau
      .addCase(sendMessageThunk.pending, (s) => {
        s.isLoading = true;
        s.error = null;
      })
      .addCase(sendMessageThunk.fulfilled, (s) => {
        // Giữ isLoading = true cho đến khi fetchMessages xong
        s.error = null;
      })
      .addCase(sendMessageThunk.rejected, (s, a) => {
        s.isLoading = false;
        s.error = a.payload as string;
      });
  },
});

export const {
  togglePanel,
  openPanel,
  closePanel,
  setActiveConversation,
  clearMessages,
  addOptimisticMessage,
} = chatSlice.actions;

export const chatReducer = chatSlice.reducer;
