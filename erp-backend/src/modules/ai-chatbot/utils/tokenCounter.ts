import { LLMMessage } from "../types/llm.types";

// Ước tính ~4 chars = 1 token (đủ chính xác cho việc giới hạn context)
const CHARS_PER_TOKEN = 4;

// Giới hạn token cho context (để lại buffer cho system prompt + tools + response)
// gpt-4o-mini có 128k context, dùng tối đa 6000 tokens cho history
const MAX_CONTEXT_TOKENS = 6000;

function estimateTokens(text: string | null): number {
  if (!text) return 0;
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

function estimateMessageTokens(msg: LLMMessage): number {
  let tokens = 4; // overhead per message
  tokens += estimateTokens(msg.content);
  if (msg.tool_calls) {
    tokens += estimateTokens(JSON.stringify(msg.tool_calls));
  }
  return tokens;
}

/**
 * Trim messages để tổng token không vượt quá MAX_CONTEXT_TOKENS.
 * Luôn giữ message đầu tiên (user message hiện tại) và trim từ đầu.
 */
export function trimToTokenLimit(
  messages: LLMMessage[],
  maxTokens: number = MAX_CONTEXT_TOKENS,
): LLMMessage[] {
  if (messages.length === 0) return messages;

  // Tính tổng token hiện tại
  const totalTokens = messages.reduce(
    (sum, m) => sum + estimateMessageTokens(m),
    0,
  );

  if (totalTokens <= maxTokens) return messages;

  // Trim từ đầu (messages cũ nhất) cho đến khi đủ
  let trimmed = [...messages];
  while (trimmed.length > 1) {
    const current = trimmed.reduce(
      (sum, m) => sum + estimateMessageTokens(m),
      0,
    );
    if (current <= maxTokens) break;

    // Bỏ message đầu tiên, nhưng đảm bảo không bỏ giữa chừng tool call sequence
    // (assistant có tool_calls phải đi kèm tool result)
    const first = trimmed[0];
    const second = trimmed[1];
    if (!first) break;

    if (
      first.role === "assistant" &&
      first.tool_calls &&
      second?.role === "tool"
    ) {
      // Bỏ cả cặp assistant+tool
      trimmed = trimmed.slice(2);
    } else {
      trimmed = trimmed.slice(1);
    }
  }

  return trimmed;
}

export function estimateTotalTokens(messages: LLMMessage[]): number {
  return messages.reduce((sum, m) => sum + estimateMessageTokens(m), 0);
}
