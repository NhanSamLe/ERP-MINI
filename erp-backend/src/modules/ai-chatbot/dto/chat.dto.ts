export interface CreateConversationDto {
  title?: string;
}

export interface SendMessageDto {
  content: string;
}

export interface ConversationSummary {
  id: number;
  title: string | null;
  created_at: Date;
  updated_at: Date;
}
