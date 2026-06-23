import { Request, Response } from "express";
import { AnomalyRepository } from "../services/anomaly/anomaly.repository";
import { ThresholdConfigService } from "../services/anomaly/thresholdConfig.service";
import { RiskLevel } from "../types/anomaly.types";

const anomalyRepository = new AnomalyRepository();
const thresholdConfigService = new ThresholdConfigService();

function handleError(res: Response, err: any) {
  const status = typeof err?.status === "number" ? err.status : 500;
  const message = err?.message ?? "Đã xảy ra lỗi, vui lòng thử lại";
  res.status(status).json({ message });
}

/**
 * Controller for anomaly detection management endpoints.
 *
 * Routes:
 *   GET  /api/document-intelligence/anomalies          → getAnomalyResults
 *   GET  /api/document-intelligence/anomalies/stats    → getBranchAnomalyStats
 *   GET  /api/document-intelligence/anomalies/config   → getThresholdConfig
 *   PUT  /api/document-intelligence/anomalies/config   → updateThresholdConfig
 *
 * Requirements: 9.3, 9.4, 10.1–10.4
 */
export const anomalyController = {
  /**
   * GET /api/document-intelligence/anomalies
   *
   * Query params:
   *   risk_level  — filter by "low_risk" | "medium_risk" | "high_risk"
   *   date_from   — ISO date string
   *   date_to     — ISO date string
   *   page        — page number (default: 1)
   *   limit       — page size (default: 20, max: 100)
   *
   * Returns paginated list of anomaly results for the user's branch,
   * ordered by risk_score DESC (Requirement 9.3).
   */
  async getAnomalyResults(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const branchId: number = user.branch_id;

      const riskLevel = req.query.risk_level as RiskLevel | undefined;
      const dateFrom = req.query.date_from
        ? new Date(req.query.date_from as string)
        : undefined;
      const dateTo = req.query.date_to
        ? new Date(req.query.date_to as string)
        : undefined;
      const page = Math.max(1, Number(req.query.page ?? 1));
      const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 20)));

      // Validate risk_level if provided
      const validRiskLevels: RiskLevel[] = [
        "low_risk",
        "medium_risk",
        "high_risk",
      ];
      if (riskLevel && !validRiskLevels.includes(riskLevel)) {
        return res.status(400).json({
          message: `risk_level không hợp lệ. Giá trị hợp lệ: ${validRiskLevels.join(", ")}`,
        });
      }

      const filters: {
        riskLevel?: RiskLevel;
        dateFrom?: Date;
        dateTo?: Date;
        page: number;
        limit: number;
      } = { page, limit };
      if (riskLevel !== undefined) filters.riskLevel = riskLevel;
      if (dateFrom !== undefined) filters.dateFrom = dateFrom;
      if (dateTo !== undefined) filters.dateTo = dateTo;

      const result = await anomalyRepository.findHighRisk(branchId, filters);

      res.status(200).json(result);
    } catch (err: any) {
      handleError(res, err);
    }
  },

  /**
   * GET /api/document-intelligence/anomalies/stats
   *
   * Query params:
   *   date_from  — ISO date string (required)
   *   date_to    — ISO date string (required)
   *
   * Returns aggregated anomaly statistics for the user's branch (Requirement 9.4):
   * - totalByRiskLevel
   * - topFlagTypes (top 10)
   * - weeklyTrend
   */
  async getBranchAnomalyStats(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const branchId: number = user.branch_id;

      const dateFromStr = req.query.date_from as string | undefined;
      const dateToStr = req.query.date_to as string | undefined;

      if (!dateFromStr || !dateToStr) {
        return res.status(400).json({
          message: "date_from và date_to là bắt buộc",
        });
      }

      const dateFrom = new Date(dateFromStr);
      const dateTo = new Date(dateToStr);

      if (isNaN(dateFrom.getTime()) || isNaN(dateTo.getTime())) {
        return res.status(400).json({
          message: "date_from hoặc date_to không hợp lệ",
        });
      }

      if (dateFrom > dateTo) {
        return res.status(400).json({
          message: "date_from phải nhỏ hơn hoặc bằng date_to",
        });
      }

      const stats = await anomalyRepository.getStatsByBranch(branchId, {
        from: dateFrom,
        to: dateTo,
      });

      res.status(200).json(stats);
    } catch (err: any) {
      handleError(res, err);
    }
  },

  /**
   * GET /api/document-intelligence/anomalies/config
   *
   * Returns the threshold configuration for the user's branch.
   * Falls back to system defaults if no custom config exists (Requirement 10.2).
   */
  async getThresholdConfig(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const branchId: number = user.branch_id;

      const config = await thresholdConfigService.getConfig(branchId);
      res.status(200).json(config);
    } catch (err: any) {
      handleError(res, err);
    }
  },

  /**
   * PUT /api/document-intelligence/anomalies/config
   *
   * Body (all fields optional — only provided fields are updated):
   *   zScoreThreshold           — number [1.0, 10.0]
   *   iqrMultiplier             — number [0.5, 5.0]
   *   frequencyThresholdPerHour — number [1, 100]
   *   approvalThresholdVnd      — number >= 0
   *   highRiskScoreThreshold    — number [0.1, 1.0]
   *   mediumRiskScoreThreshold  — number [0.1, 1.0]
   *
   * Returns the updated configuration (Requirement 10.1, 10.3, 10.4).
   * Returns 400 if any value is out of range.
   */
  async updateThresholdConfig(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const branchId: number = user.branch_id;

      const {
        zScoreThreshold,
        iqrMultiplier,
        frequencyThresholdPerHour,
        approvalThresholdVnd,
        highRiskScoreThreshold,
        mediumRiskScoreThreshold,
      } = req.body;

      // Build partial update — only include fields that were provided
      const params: Record<string, number> = {};
      if (zScoreThreshold !== undefined)
        params.zScoreThreshold = Number(zScoreThreshold);
      if (iqrMultiplier !== undefined)
        params.iqrMultiplier = Number(iqrMultiplier);
      if (frequencyThresholdPerHour !== undefined)
        params.frequencyThresholdPerHour = Number(frequencyThresholdPerHour);
      if (approvalThresholdVnd !== undefined)
        params.approvalThresholdVnd = Number(approvalThresholdVnd);
      if (highRiskScoreThreshold !== undefined)
        params.highRiskScoreThreshold = Number(highRiskScoreThreshold);
      if (mediumRiskScoreThreshold !== undefined)
        params.mediumRiskScoreThreshold = Number(mediumRiskScoreThreshold);

      if (Object.keys(params).length === 0) {
        return res.status(400).json({
          message: "Không có tham số nào được cung cấp để cập nhật",
        });
      }

      const updated = await thresholdConfigService.updateConfig(
        branchId,
        params,
        user.id,
      );

      res.status(200).json(updated);
    } catch (err: any) {
      // Validation errors from ThresholdConfigService have descriptive messages
      if (
        err?.message?.includes("must be between") ||
        err?.message?.includes("must be") ||
        err?.message?.includes("less than")
      ) {
        return res.status(400).json({ message: err.message });
      }
      handleError(res, err);
    }
  },
};
