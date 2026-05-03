import { Sequelize, Op } from "sequelize";
import { KPICalculatorService } from "./kpi-calculator.service";
import { PromptBuilderService } from "./prompt-builder.service";
import { LLMIntegrationOpenAIService } from "./llm-integration-openai.service";
import { NarrativeConfig } from "../models/narrative-config.model";
import { NarrativeCache } from "../models/narrative-cache.model";
import { NarrativeLog } from "../models/narrative-log.model";
import {
  GenerateNarrativeRequest,
  GenerateNarrativeResponse,
} from "../types/narrative.types";
import * as crypto from "crypto";

// Default configs — dùng khi DB chưa có seed
const DEFAULT_CONFIGS: Record<string, any> = {
  monthly_report: {
    promptTemplate: `Bạn là một chuyên gia phân tích tài chính có 15 năm kinh nghiệm.
Dựa trên dữ liệu KPI sau, hãy viết một đoạn nhận xét chuyên nghiệp (3-5 câu) về tình hình tài chính của công ty trong tháng.

Dữ liệu KPI:
{kpi_data}

Yêu cầu: Viết bằng tiếng Việt, tone chuyên nghiệp, highlight điểm nổi bật, nhận xét xu hướng.`,
    maxTokens: 500,
    temperature: 0.7,
  },
  sales_performance: {
    promptTemplate: `Bạn là một chuyên gia bán hàng có 15 năm kinh nghiệm.
Dựa trên dữ liệu bán hàng sau, hãy viết một đoạn nhận xét chuyên nghiệp (3-5 câu).

Dữ liệu:
{kpi_data}

Yêu cầu: Viết bằng tiếng Việt, phân tích top products, nhận xét xu hướng bán hàng.`,
    maxTokens: 500,
    temperature: 0.7,
  },
  vendor_performance: {
    promptTemplate: `Bạn là một chuyên gia quản lý chuỗi cung ứng có 15 năm kinh nghiệm.
Dựa trên dữ liệu nhà cung cấp sau, hãy viết một đoạn nhận xét chuyên nghiệp (3-5 câu).

Dữ liệu:
{kpi_data}

Yêu cầu: Viết bằng tiếng Việt, đánh giá hiệu suất nhà cung cấp, nhận xét về hóa đơn quá hạn.`,
    maxTokens: 500,
    temperature: 0.7,
  },
  cash_flow: {
    promptTemplate: `Bạn là một chuyên gia tài chính có 15 năm kinh nghiệm.
Dựa trên dữ liệu dòng tiền sau, hãy viết một đoạn nhận xét chuyên nghiệp (3-5 câu).

Dữ liệu:
{kpi_data}

Yêu cầu: Viết bằng tiếng Việt, phân tích AR/AP, nhận xét DSO/DPO.`,
    maxTokens: 500,
    temperature: 0.7,
  },
};

export class NarrativeService {
  private kpiCalculator: KPICalculatorService;
  private promptBuilder: PromptBuilderService;
  private llmIntegration: LLMIntegrationOpenAIService;

  constructor(private sequelize: Sequelize) {
    this.kpiCalculator = new KPICalculatorService(sequelize);
    this.promptBuilder = new PromptBuilderService();
    this.llmIntegration = new LLMIntegrationOpenAIService();
  }

  /**
   * Generate narrative based on request
   */
  async generateNarrative(
    request: GenerateNarrativeRequest,
    userId: number,
  ): Promise<GenerateNarrativeResponse> {
    try {
      // 1. Check cache
      if (!request.forceRefresh) {
        const cached = await this.getFromCache(
          request.companyId,
          request.narrativeType,
          request.periodStart,
          request.periodEnd,
        );

        if (cached) {
          return {
            success: true,
            data: cached,
            cacheHit: true,
          };
        }
      }

      // 2. Calculate KPIs — theo từng narrativeType
      let kpis: any;
      switch (request.narrativeType) {
        case "sales_performance":
          kpis = await this.kpiCalculator.calculateSalesPerformanceKPIs(
            request.companyId,
            request.periodStart,
            request.periodEnd,
          );
          break;
        case "vendor_performance":
          kpis = await this.kpiCalculator.calculateVendorPerformanceKPIs(
            request.companyId,
            request.periodStart,
            request.periodEnd,
          );
          break;
        case "cash_flow":
          kpis = await this.kpiCalculator.calculateCashFlowKPIs(
            request.companyId,
            request.periodStart,
            request.periodEnd,
          );
          break;
        case "monthly_report":
        default:
          kpis = await this.kpiCalculator.calculateMonthlyReportKPIs(
            request.companyId,
            request.periodStart,
            request.periodEnd,
          );
          break;
      }
      console.log(
        "[NARRATIVE] KPIs calculated:",
        JSON.stringify(kpis, null, 2),
      );

      // 3. Get config — fallback về default nếu không có trong DB
      const config = await NarrativeConfig.findOne({
        where: {
          companyId: request.companyId,
          narrativeType: request.narrativeType,
          isActive: true,
        },
      });

      const configData =
        config?.toJSON() ?? DEFAULT_CONFIGS[request.narrativeType];

      // 4. Build prompt — switch theo narrativeType
      let prompt: string;
      switch (request.narrativeType) {
        case "sales_performance":
          prompt = this.promptBuilder.buildSalesPerformancePrompt(
            kpis,
            configData as any,
          );
          break;
        case "vendor_performance":
          prompt = this.promptBuilder.buildVendorPerformancePrompt(
            kpis,
            configData as any,
          );
          break;
        case "cash_flow":
          prompt = this.promptBuilder.buildCashFlowPrompt(
            kpis,
            configData as any,
          );
          break;
        case "monthly_report":
        default:
          prompt = this.promptBuilder.buildMonthlyReportPrompt(
            kpis,
            configData as any,
          );
          break;
      }

      // 5. Generate narrative
      const startTime = Date.now();
      const narrative = await this.llmIntegration.generateNarrative(
        prompt,
        configData.maxTokens ?? 500,
        configData.temperature ?? 0.7,
      );
      const generationTime = Date.now() - startTime;

      // 6. Save to cache
      await this.saveToCache(
        request.companyId,
        request.narrativeType,
        request.periodStart,
        request.periodEnd,
        narrative,
      );

      // 7. Log
      try {
        await NarrativeLog.create({
          companyId: request.companyId,
          userId,
          narrativeType: request.narrativeType,
          periodStart: new Date(request.periodStart),
          periodEnd: new Date(request.periodEnd),
          inputData: JSON.stringify(kpis),
          outputNarrative: narrative.narrative,
          tokensUsed: narrative.metadata.tokensUsed,
          generationTimeMs: generationTime,
          status: "success",
        } as any);
      } catch (logErr) {
        console.error("[NARRATIVE] Failed to save log (non-fatal):", logErr);
      }

      return {
        success: true,
        data: narrative,
        cacheHit: false,
      };
    } catch (error) {
      console.error(
        "[NARRATIVE] Error generating narrative:",
        (error as any).message,
        (error as any).stack,
      );

      // Log error
      try {
        await NarrativeLog.create({
          companyId: request.companyId,
          userId,
          narrativeType: request.narrativeType,
          periodStart: new Date(request.periodStart),
          periodEnd: new Date(request.periodEnd),
          inputData: JSON.stringify(request),
          status: "failed",
          errorMessage: (error as any).message,
        } as any);
      } catch (logError) {
        console.error("Error logging narrative failure:", logError);
      }

      return {
        success: false,
        error: (error as any).message,
      };
    }
  }

  /**
   * Get narrative from cache
   */
  private async getFromCache(
    companyId: number,
    narrativeType: string,
    periodStart: string,
    periodEnd: string,
  ): Promise<any> {
    try {
      const cached = await NarrativeCache.findOne({
        where: {
          companyId,
          narrativeType,
          periodStart: new Date(periodStart),
          periodEnd: new Date(periodEnd),
        },
      });

      if (cached && new Date(cached.ttlExpiresAt) > new Date()) {
        return JSON.parse(cached.narrativeText);
      }

      return null;
    } catch (error) {
      console.error("Error getting from cache:", error);
      return null;
    }
  }

  /**
   * Save narrative to cache
   */
  private async saveToCache(
    companyId: number,
    narrativeType: string,
    periodStart: string,
    periodEnd: string,
    narrative: any,
  ): Promise<void> {
    try {
      const ttlExpiresAt = new Date();
      ttlExpiresAt.setDate(ttlExpiresAt.getDate() + 7); // 7-day TTL

      await NarrativeCache.create({
        companyId,
        narrativeType,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        dataHash: this.generateHash(JSON.stringify(narrative)),
        narrativeText: JSON.stringify(narrative),
        ttlExpiresAt,
      } as any);
    } catch (error) {
      console.error("Error saving to cache:", error);
      // Don't throw - cache failure shouldn't break the flow
    }
  }

  /**
   * Generate hash for data
   */
  private generateHash(data: string): string {
    return crypto.createHash("sha256").update(data).digest("hex");
  }

  /**
   * Get narrative logs
   */
  async getNarrativeLogs(
    companyId: number,
    limit: number = 50,
    offset: number = 0,
  ): Promise<any> {
    try {
      const logs = await NarrativeLog.findAndCountAll({
        where: { companyId },
        order: [["createdAt", "DESC"]],
        limit,
        offset,
      });

      return {
        success: true,
        data: logs.rows,
        total: logs.count,
      };
    } catch (error) {
      console.error("Error fetching logs:", error);
      return {
        success: false,
        error: (error as any).message,
      };
    }
  }

  /**
   * Get narrative cache statistics
   */
  async getCacheStats(companyId: number): Promise<any> {
    try {
      const totalCached = await NarrativeCache.count({
        where: { companyId },
      });

      const expiredCached = await NarrativeCache.count({
        where: {
          companyId,
          ttlExpiresAt: { [Op.lt]: new Date() },
        },
      });

      return {
        success: true,
        data: {
          totalCached,
          expiredCached,
          activeCached: totalCached - expiredCached,
          cacheHitRate:
            totalCached > 0
              ? ((totalCached - expiredCached) / totalCached) * 100
              : 0,
        },
      };
    } catch (error) {
      console.error("Error getting cache stats:", error);
      return {
        success: false,
        error: (error as any).message,
      };
    }
  }

  /**
   * Clear expired cache
   */
  async clearExpiredCache(): Promise<any> {
    try {
      const deleted = await NarrativeCache.destroy({
        where: {
          ttlExpiresAt: { [Op.lt]: new Date() },
        },
      });

      return {
        success: true,
        data: {
          deletedCount: deleted,
        },
      };
    } catch (error) {
      console.error("Error clearing expired cache:", error);
      return {
        success: false,
        error: (error as any).message,
      };
    }
  }
}
