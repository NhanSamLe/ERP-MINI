import { IOcrEngine } from "../types/ocr.types";
import { OpenAIVisionOcr } from "./openaiVisionOcr.service";
import { logger } from "../../../config/logger";
import { ocrConfig } from "./ocrConfig.service";

export class OcrEngineFactory {
  static create(): IOcrEngine {
    const engine = ocrConfig.get("ocrEngine");
    const apiKey = ocrConfig.get("openaiApiKey");
    const timeoutMs = ocrConfig.get("ocrTimeoutMs");
    const model = ocrConfig.get("openaiModel");

    switch (engine) {
      case "openai_vision":
        return new OpenAIVisionOcr(apiKey, model, timeoutMs);
      case "google_doc_ai":
        // Phase 2 stub — falls back to openai_vision
        logger.warn(
          "google_doc_ai engine not yet implemented, falling back to openai_vision",
        );
        return new OpenAIVisionOcr(apiKey, model, timeoutMs);
      default:
        logger.warn(
          `Unknown OCR_ENGINE: "${engine}", defaulting to openai_vision`,
        );
        return new OpenAIVisionOcr(apiKey, model, timeoutMs);
    }
  }
}
