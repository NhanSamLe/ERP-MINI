import { IOcrEngine } from "../types/ocr.types";
import { OpenAIVisionOcr } from "./openaiVisionOcr.service";
import { logger } from "../../../config/logger";

export class OcrEngineFactory {
  static create(): IOcrEngine {
    const engine = process.env.OCR_ENGINE || "openai_vision";
    const apiKey = process.env.LLM_API_KEY || process.env.OPENAI_API_KEY || "";
    const timeoutMs = parseInt(process.env.OCR_TIMEOUT_MS || "25000", 10);

    switch (engine) {
      case "openai_vision":
        return new OpenAIVisionOcr(apiKey, "gpt-4o-mini", timeoutMs);
      case "google_doc_ai":
        // Phase 2 stub — falls back to openai_vision
        logger.warn(
          "google_doc_ai engine not yet implemented, falling back to openai_vision",
        );
        return new OpenAIVisionOcr(apiKey, "gpt-4o-mini", timeoutMs);
      default:
        logger.warn(
          `Unknown OCR_ENGINE: "${engine}", defaulting to openai_vision`,
        );
        return new OpenAIVisionOcr(apiKey, "gpt-4o-mini", timeoutMs);
    }
  }
}
