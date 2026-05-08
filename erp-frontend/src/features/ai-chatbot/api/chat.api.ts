import axiosClient from "../../../api/axiosClient";
import {
  Conversation,
  ChatMessage,
  CreateConversationRequest,
  SendMessageRequest,
} from "../types/chat.types";

export const chatApi = {
  getConversations: async (): Promise<Conversation[]> => {
    const res = await axiosClient.get("/chatbot/conversations");
    return res.data.conversations;
  },

  createConversation: async (
    data?: CreateConversationRequest,
  ): Promise<Conversation> => {
    const res = await axiosClient.post("/chatbot/conversations", data ?? {});
    return res.data.conversation;
  },

  getMessages: async (conversationId: number): Promise<ChatMessage[]> => {
    const res = await axiosClient.get(
      `/chatbot/conversations/${conversationId}/messages`,
    );
    return res.data.messages;
  },

  sendMessage: async (
    conversationId: number,
    data: SendMessageRequest,
  ): Promise<ChatMessage> => {
    const res = await axiosClient.post(
      `/chatbot/conversations/${conversationId}/messages`,
      data,
    );
    return res.data.message;
  },
};
