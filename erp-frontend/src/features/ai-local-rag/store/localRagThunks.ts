import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosClient from "../../../api/axiosClient";
import { getErrorMessage } from "../../../utils/ErrorHelper";
import type { LocalChatMessage, ERPModule } from "../types/local-rag.types";

export const sendLocalMessageThunk = createAsyncThunk(
  "localRag/sendMessage",
  async (
    { message, module, history }: { message: string; module?: ERPModule; history: LocalChatMessage[] },
    { rejectWithValue }
  ) => {
    try {
      const payload: { message: string; module?: ERPModule; history: LocalChatMessage[] } = {
        message,
        history,
      };
      if (module) {
        payload.module = module;
      }

      const res = await axiosClient.post("/ai/chat", payload);
      return res.data as { answer: string; sources: any[] };
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  }
);

export const fetchConversationsThunk = createAsyncThunk(
  "localRag/fetchConversations",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosClient.get("/chatbot/conversations");
      return res.data.conversations;
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  }
);

export const createConversationThunk = createAsyncThunk(
  "localRag/createConversation",
  async (title: string, { rejectWithValue }) => {
    try {
      const res = await axiosClient.post("/chatbot/conversations", { title });
      return res.data.conversation;
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  }
);

export const loadConversationMessagesThunk = createAsyncThunk(
  "localRag/loadConversationMessages",
  async (conversationId: number, { rejectWithValue }) => {
    try {
      const res = await axiosClient.get(`/chatbot/conversations/${conversationId}/messages`);
      return res.data.messages;
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  }
);
