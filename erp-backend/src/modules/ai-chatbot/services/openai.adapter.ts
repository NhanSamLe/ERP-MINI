import OpenAI from "openai";
import {
  ILLMAdapter,
  LLMChatParams,
  LLMChatResponse,
  ToolCall,
} from "../types/llm.types";

export class OpenAIAdapter implements ILLMAdapter {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  async chat(params: LLMChatParams): Promise<LLMChatResponse> {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: params.systemPrompt },
      ...params.messages.map((m): OpenAI.Chat.ChatCompletionMessageParam => {
        if (m.role === "tool") {
          return {
            role: "tool",
            content: m.content ?? "",
            tool_call_id: m.tool_call_id ?? "",
          };
        }
        if (m.role === "assistant" && m.tool_calls && m.tool_calls.length > 0) {
          return {
            role: "assistant",
            content: m.content ?? null,
            tool_calls: m.tool_calls.map((tc) => ({
              id: tc.id,
              type: "function" as const,
              function: {
                name: tc.name,
                arguments: JSON.stringify(tc.arguments),
              },
            })),
          };
        }
        return {
          role: m.role as "user" | "assistant",
          content: m.content ?? "",
        };
      }),
    ];

    const tools: OpenAI.Chat.ChatCompletionTool[] = params.tools.map((t) => ({
      type: "function" as const,
      function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters as any,
      },
    }));

    const createParams: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming = {
      model: this.model,
      messages,
      ...(tools.length > 0 && { tools, tool_choice: "auto" }),
    };

    const response = await this.client.chat.completions.create(createParams);

    const choice = response.choices[0];
    if (!choice) {
      return {
        content: null,
        toolCalls: null,
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      };
    }

    const message = choice.message;

    // Parse tool calls nếu có
    let toolCalls: ToolCall[] | null = null;
    if (message.tool_calls && message.tool_calls.length > 0) {
      toolCalls = message.tool_calls
        .filter((tc) => tc.type === "function")
        .map((tc) => ({
          id: tc.id,
          name: (tc as any).function.name as string,
          arguments: JSON.parse((tc as any).function.arguments || "{}"),
        }));
    }

    return {
      content: message.content ?? null,
      toolCalls,
      usage: {
        prompt_tokens: response.usage?.prompt_tokens ?? 0,
        completion_tokens: response.usage?.completion_tokens ?? 0,
        total_tokens: response.usage?.total_tokens ?? 0,
      },
    };
  }
}
