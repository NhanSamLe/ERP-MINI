export type ERPModule = 'crm' | 'purchase' | 'sale' | 'inventory' | 'report';

export interface SearchSource {
  score: number;
  entity_id: number;
  entity_type: string;
  module: string;
  content_text: string;
}

export interface LocalChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  sources?: SearchSource[];
}
