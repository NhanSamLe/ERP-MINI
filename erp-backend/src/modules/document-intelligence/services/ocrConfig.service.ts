import { logger } from "../../../config/logger";

export interface OCRConfig {
  // OCR Engine
  ocrEngine: "openai_vision" | "google_doc_ai";
  ocrTimeoutMs: number;

  // Auto-create thresholds
  minConfidenceAutoCreate: number;
  vendorMatchMinConfidence: number;
  productMatchMinConfidence: number;
  autoCreateWithMismatches: boolean;

  // File constraints
  maxFileSizeMb: number;

  // API
  openaiApiKey: string;
  openaiModel: string;
}

/**
 * OCRConfigService — tải, validate và cung cấp cấu hình OCR từ env.
 *
 * Ví dụ thực tế:
 *  - Dev environment: OCR_MIN_CONFIDENCE_AUTO_CREATE=0.70 (thấp hơn để test)
 *  - Production: OCR_MIN_CONFIDENCE_AUTO_CREATE=0.85 (ngưỡng cao hơn)
 *  - Chi nhánh đặc biệt: có thể override qua DB (branch_ocr_config)
 */
export class OCRConfigService {
  private static instance: OCRConfigService;
  private config: OCRConfig;

  private constructor() {
    this.config = this.loadConfig();
    this.validateConfig();
  }

  static getInstance(): OCRConfigService {
    if (!OCRConfigService.instance) {
      OCRConfigService.instance = new OCRConfigService();
    }
    return OCRConfigService.instance;
  }

  /**
   * Tải config từ environment variables với fallback defaults.
   */
  private loadConfig(): OCRConfig {
    return {
      ocrEngine: (process.env.OCR_ENGINE || "openai_vision") as
        | "openai_vision"
        | "google_doc_ai",
      ocrTimeoutMs: parseInt(process.env.OCR_TIMEOUT_MS || "25000", 10),

      minConfidenceAutoCreate: parseFloat(
        process.env.OCR_MIN_CONFIDENCE_AUTO_CREATE || "0.85",
      ),
      vendorMatchMinConfidence: parseFloat(
        process.env.VENDOR_MATCH_MIN_CONFIDENCE || "0.90",
      ),
      productMatchMinConfidence: parseFloat(
        process.env.PRODUCT_MATCH_MIN_CONFIDENCE || "0.80",
      ),
      autoCreateWithMismatches:
        process.env.AUTO_CREATE_WITH_MISMATCHES === "true",

      maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB || "10", 10),

      openaiApiKey: process.env.LLM_API_KEY || process.env.OPENAI_API_KEY || "",
      openaiModel: process.env.OCR_MODEL || process.env.LLM_MODEL || "gpt-4o-mini",
    };
  }

  /**
   * Validate config và throw nếu có giá trị không hợp lệ.
   * Fail fast — không để server khởi động với config sai.
   */
  private validateConfig(): void {
    const errors: string[] = [];

    if (!["openai_vision", "google_doc_ai"].includes(this.config.ocrEngine)) {
      errors.push(
        `OCR_ENGINE không hợp lệ: "${this.config.ocrEngine}". Phải là "openai_vision" hoặc "google_doc_ai"`,
      );
    }

    if (
      this.config.minConfidenceAutoCreate < 0 ||
      this.config.minConfidenceAutoCreate > 1
    ) {
      errors.push(
        `OCR_MIN_CONFIDENCE_AUTO_CREATE phải trong khoảng 0.0 - 1.0, hiện tại: ${this.config.minConfidenceAutoCreate}`,
      );
    }

    if (
      this.config.vendorMatchMinConfidence < 0 ||
      this.config.vendorMatchMinConfidence > 1
    ) {
      errors.push(
        `VENDOR_MATCH_MIN_CONFIDENCE phải trong khoảng 0.0 - 1.0, hiện tại: ${this.config.vendorMatchMinConfidence}`,
      );
    }

    if (
      this.config.productMatchMinConfidence < 0 ||
      this.config.productMatchMinConfidence > 1
    ) {
      errors.push(
        `PRODUCT_MATCH_MIN_CONFIDENCE phải trong khoảng 0.0 - 1.0, hiện tại: ${this.config.productMatchMinConfidence}`,
      );
    }

    if (this.config.maxFileSizeMb <= 0 || this.config.maxFileSizeMb > 100) {
      errors.push(
        `MAX_FILE_SIZE_MB phải trong khoảng 1 - 100, hiện tại: ${this.config.maxFileSizeMb}`,
      );
    }

    if (this.config.ocrTimeoutMs < 5000 || this.config.ocrTimeoutMs > 120000) {
      errors.push(
        `OCR_TIMEOUT_MS phải trong khoảng 5000 - 120000ms, hiện tại: ${this.config.ocrTimeoutMs}`,
      );
    }

    if (errors.length > 0) {
      const msg = `OCR Config validation failed:\n${errors.map((e) => `  - ${e}`).join("\n")}`;
      logger.error(msg);
      throw new Error(msg);
    }
  }

  /**
   * Lấy toàn bộ config.
   */
  getConfig(): OCRConfig {
    return { ...this.config };
  }

  /**
   * Lấy một giá trị config cụ thể.
   */
  get<K extends keyof OCRConfig>(key: K): OCRConfig[K] {
    return this.config[key];
  }

  /**
   * Log tất cả config values khi startup (ẩn API key).
   * Dùng trong app.ts hoặc server.ts để audit.
   */
  logConfigOnStartup(): void {
    const safeConfig = {
      ...this.config,
      openaiApiKey: this.config.openaiApiKey
        ? `${this.config.openaiApiKey.substring(0, 8)}...`
        : "(not set)",
    };

    logger.info("=== OCR Configuration ===");
    logger.info(`  Engine:                    ${safeConfig.ocrEngine}`);
    logger.info(`  Model:                     ${safeConfig.openaiModel}`);
    logger.info(`  Timeout:                   ${safeConfig.ocrTimeoutMs}ms`);
    logger.info(
      `  Min Confidence (auto):     ${safeConfig.minConfidenceAutoCreate}`,
    );
    logger.info(
      `  Vendor Match Min:          ${safeConfig.vendorMatchMinConfidence}`,
    );
    logger.info(
      `  Product Match Min:         ${safeConfig.productMatchMinConfidence}`,
    );
    logger.info(
      `  Auto Create w/ Mismatches: ${safeConfig.autoCreateWithMismatches}`,
    );
    logger.info(`  Max File Size:             ${safeConfig.maxFileSizeMb}MB`);
    logger.info(`  API Key:                   ${safeConfig.openaiApiKey}`);
    logger.info("=========================");
  }
}

// Singleton export
export const ocrConfig = OCRConfigService.getInstance();
