export type MessageRole = "user" | "assistant" | "tool";

export interface ChatMessage {
  id: number;
  conversation_id: number;
  role: MessageRole;
  content: string;
  tool_name?: string | null;
  tool_call_id?: string | null;
  created_at?: string;
}

export interface Conversation {
  id: number;
  user_id: number;
  branch_id: number;
  title: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ConversationSummary {
  id: number;
  title: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface SendMessageRequest {
  content: string;
}

export interface CreateConversationRequest {
  title?: string;
}
