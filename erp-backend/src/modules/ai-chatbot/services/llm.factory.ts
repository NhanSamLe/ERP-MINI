import { ILLMAdapter } from "../types/llm.types";
import { OpenAIAdapter } from "./openai.adapter";

export class LLMFactory {
  static create(): ILLMAdapter {
    const model = process.env.LLM_MODEL ?? "gpt-4o-mini";
    const apiKey = process.env.LLM_API_KEY;

    if (!apiKey) {
      throw new Error(
        "[LLMFactory] LLM_API_KEY chưa được cấu hình trong file .env",
      );
    }

    return new OpenAIAdapter(apiKey, model);
  }
}
