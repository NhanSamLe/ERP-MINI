import OpenAI from "openai";
import { NarrativeOutput } from "../types/narrative.types";

export class LLMIntegrationOpenAIService {
  private client: OpenAI;
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // ms
  private readonly apiKey: string;
  private readonly model: string;

  // Hard caps để tránh tốn credit không kiểm soát
  private readonly MAX_TOKENS_CAP = 600; // tối đa 600 tokens/request
  private readonly REQUEST_TIMEOUT_MS = 30000; // timeout 30s, không treo vô hạn

  constructor(apiKey?: string, model?: string) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || "";
    this.model = model || process.env.OPENAI_MODEL || "gpt-4o-mini";

    if (!this.apiKey) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    this.client = new OpenAI({
      apiKey: this.apiKey,
      timeout: this.REQUEST_TIMEOUT_MS,
      maxRetries: 0, // tự handle retry để kiểm soát tốt hơn
    });
  }

  /**
   * Generate narrative from prompt
   */
  async generateNarrative(
    prompt: string,
    maxTokens: number = 500,
    temperature: number = 0.7,
  ): Promise<NarrativeOutput> {
    try {
      const response = await this.retryWithBackoff(
        () => this.callOpenAIAPI(prompt, maxTokens, temperature),
        this.maxRetries,
      );

      return this.parseResponse(response);
    } catch (error) {
      console.error("LLM Generation Error:", error);
      throw new Error(
        "Failed to generate narrative: " + (error as any).message,
      );
    }
  }

  /**
   * Call OpenAI API
   */
  private async callOpenAIAPI(
    prompt: string,
    maxTokens: number,
    temperature: number,
  ) {
    // Enforce hard cap — không cho phép vượt quá dù config truyền vào cao hơn
    const safeMaxTokens = Math.min(maxTokens, this.MAX_TOKENS_CAP);

    const startTime = Date.now();

    const response = await this.client.chat.completions.create({
      model: this.model,
      max_tokens: safeMaxTokens,
      temperature,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const generationTime = Date.now() - startTime;

    return {
      response,
      generationTime,
    };
  }

  /**
   * Retry logic with exponential backoff
   */
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number,
  ): Promise<T> {
    let lastError: Error = new Error("Unknown error");

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        // Don't retry on client errors (4xx)
        if ((error as any).status >= 400 && (error as any).status < 500) {
          throw error;
        }

        // Exponential backoff: 1s, 2s, 4s
        if (i < maxRetries - 1) {
          const delay = this.retryDelay * Math.pow(2, i);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  /**
   * Parse response from OpenAI
   */
  private parseResponse(data: {
    response: any;
    generationTime: number;
  }): NarrativeOutput {
    const { response, generationTime } = data;
    const content = response.choices[0].message.content;

    if (!content) {
      throw new Error("Empty response from OpenAI");
    }

    return {
      narrativeType: "monthly_report" as any, // set by caller context
      period: { startDate: "", endDate: "" }, // set by caller context
      narrative: content,
      keyInsights: this.extractKeyInsights(content),
      risks: this.extractRisks(content),
      recommendations: this.extractRecommendations(content),
      metadata: {
        tokensUsed:
          response.usage.prompt_tokens + response.usage.completion_tokens,
        generationTimeMs: generationTime,
        model: response.model,
        temperature: 0.7,
      },
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Extract key insights from narrative
   */
  private extractKeyInsights(narrative: string): string[] {
    const keywords = ["tăng", "giảm", "đáng chú ý", "cải thiện", "sụt giảm"];
    const sentences = narrative.split(".");

    return sentences
      .filter((s) => keywords.some((k) => s.toLowerCase().includes(k)))
      .slice(0, 3)
      .map((s) => s.trim());
  }

  /**
   * Extract risks from narrative
   */
  private extractRisks(narrative: string): string[] {
    const riskKeywords = [
      "rủi ro",
      "nguy cơ",
      "cảnh báo",
      "cần chú ý",
      "vấn đề",
    ];
    const sentences = narrative.split(".");

    return sentences
      .filter((s) => riskKeywords.some((k) => s.toLowerCase().includes(k)))
      .slice(0, 2)
      .map((s) => s.trim());
  }

  /**
   * Extract recommendations from narrative
   */
  private extractRecommendations(narrative: string): string[] {
    const recKeywords = ["nên", "khuyến nghị", "cần", "hành động", "thực hiện"];
    const sentences = narrative.split(".");

    return sentences
      .filter((s) => recKeywords.some((k) => s.toLowerCase().includes(k)))
      .slice(0, 2)
      .map((s) => s.trim());
  }
}
