export type ERPModule = "crm" | "purchase" | "sale" | "inventory" | "report";

export type EntityType =
  | "customer"
  | "lead"
  | "contact" // CRM
  | "vendor"
  | "purchase_order" // Purchase
  | "sale_order"
  | "quotation" // Sale
  | "product"
  | "stock_move" // Inventory
  | "invoice"
  | "payment"; // Accounting

export interface EmbedPayload {
  module: ERPModule;
  entity_type: EntityType;
  entity_id: number;
  branch_id: number;
  content_text: string;
  content_hash: string;
  extra?: Record<string, unknown>;
}

export interface SearchResult {
  score: number;
  entity_id: number;
  entity_type: EntityType;
  module: ERPModule;
  branch_id: number;
  content_text: string;
  extra?: Record<string, unknown>;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  message: string;
  module?: ERPModule;
  history?: ChatMessage[];
  top_k?: number;
  userRole?: string;
  branchId?: number;
  conversationId?: number;
}

export interface ChatResponse {
  answer: string;
  sources: SearchResult[];
  model: string;
}

export interface SyncJobResult {
  module: ERPModule;
  total: number;
  upserted: number;
  skipped: number;
  failed: number;
  duration_ms: number;
}
