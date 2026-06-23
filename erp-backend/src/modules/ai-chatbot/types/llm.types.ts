// ─── LLM Message ─────────────────────────────────────────────────────────────

export type LLMRole = "system" | "user" | "assistant" | "tool";

export interface LLMMessage {
  role: LLMRole;
  content: string | null;
  tool_call_id?: string; // dùng khi role = "tool"
  name?: string; // tên tool khi role = "tool"
  tool_calls?: Array<{
    id: string;
    name: string;
    arguments: Record<string, any>;
  }>; // dùng khi role = "assistant"
}

// ─── Tool Definition (JSON Schema) ───────────────────────────────────────────

export interface ToolParameter {
  type: string;
  description?: string;
  enum?: string[];
  default?: any;
  properties?: Record<string, ToolParameter>;
  items?: ToolParameter;
  required?: string[];
}

export interface ToolParameters {
  type: "object";
  properties: Record<string, ToolParameter>;
  required?: string[];
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: ToolParameters;
}

// ─── Tool Call (từ LLM) ───────────────────────────────────────────────────────

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
}

// ─── Token Usage ──────────────────────────────────────────────────────────────

export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

// ─── LLM Chat Params & Response ──────────────────────────────────────────────

export interface LLMChatParams {
  messages: LLMMessage[];
  tools: ToolDefinition[];
  systemPrompt: string;
}

export interface LLMChatResponse {
  content: string | null;
  toolCalls: ToolCall[] | null;
  usage: TokenUsage;
}

// ─── LLM Adapter Interface ───────────────────────────────────────────────────

export interface ILLMAdapter {
  chat(params: LLMChatParams): Promise<LLMChatResponse>;
}

// ─── Tool Context & Result ───────────────────────────────────────────────────

export interface ToolContext {
  userToken: string;
  branchId: number;
  baseUrl: string;
  conversationId?: number; // dùng để lưu intermediate messages
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
}

// ─── Tool Interface ───────────────────────────────────────────────────────────

export interface ITool {
  name: string;
  description: string;
  parameters: ToolParameters;
  execute(args: any, context: ToolContext): Promise<ToolResult>;
}
