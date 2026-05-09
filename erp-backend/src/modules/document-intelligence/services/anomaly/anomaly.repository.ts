import { Op, fn, col, literal } from "sequelize";
import { InvoiceAnomalyResult } from "../../models/invoiceAnomalyResult.model";
import { InvoiceDocument } from "../../models/invoiceDocument.model";
import {
  AnomalyResult,
  AnomalyQueryFilters,
  DateRange,
  BranchAnomalyStats,
  PaginatedResult,
  RiskLevel,
  AnomalyFlagType,
} from "../../types/anomaly.types";

/**
 * AnomalyRepository handles persistence and querying of anomaly analysis results.
 *
 * Design decisions:
 * - save() always creates a NEW record (immutable history — Requirement 9.2)
 * - findHighRisk() supports pagination and filtering by risk_level / date range
 * - getStatsByBranch() aggregates counts, top flag types, and weekly trend
 * - recordOverride() updates the most recent anomaly record for a document
 *
 * Requirements: 9.1–9.5
 */
export class AnomalyRepository {
  /**
   * Persist a new AnomalyResult for a document.
   * Always creates a new record — never overwrites existing ones (Req 9.2).
   */
  async save(
    documentId: number,
    result: AnomalyResult,
  ): Promise<InvoiceAnomalyResult> {
    return InvoiceAnomalyResult.create({
      document_id: documentId,
      risk_score: result.risk_score,
      risk_level: result.risk_level,
      flags: result.flags,
      math_consistent: result.math_consistent,
      skipped_reasons: result.skipped_reasons ?? [],
      analysis_duration_ms: result.analysis_duration_ms,
      analyzed_at: result.analyzed_at,
    });
  }

  /**
   * Find all anomaly records for a specific document (most recent first).
   */
  async findByDocumentId(documentId: number): Promise<InvoiceAnomalyResult[]> {
    return InvoiceAnomalyResult.findAll({
      where: { document_id: documentId },
      order: [["analyzed_at", "DESC"]],
    });
  }

  /**
   * Query invoices with the highest risk scores for a branch.
   * Joins invoice_anomaly_results → invoice_documents to filter by branch_id.
   * Supports pagination and filtering by risk_level and date range (Req 9.3).
   */
  async findHighRisk(
    branchId: number,
    filters: AnomalyQueryFilters,
  ): Promise<PaginatedResult<InvoiceAnomalyResult>> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const offset = (page - 1) * limit;

    // Build where clause for anomaly results
    const anomalyWhere: Record<string, any> = {};
    if (filters.riskLevel) {
      anomalyWhere.risk_level = filters.riskLevel;
    }
    if (filters.dateFrom || filters.dateTo) {
      anomalyWhere.analyzed_at = {};
      if (filters.dateFrom) {
        anomalyWhere.analyzed_at[Op.gte] = filters.dateFrom;
      }
      if (filters.dateTo) {
        anomalyWhere.analyzed_at[Op.lte] = filters.dateTo;
      }
    }

    const { rows, count } = await InvoiceAnomalyResult.findAndCountAll({
      where: anomalyWhere,
      include: [
        {
          model: InvoiceDocument,
          as: "document",
          where: { branch_id: branchId },
          required: true,
          attributes: ["id", "branch_id", "original_filename", "ocr_status"],
        },
      ],
      order: [["risk_score", "DESC"]],
      limit,
      offset,
    });

    return {
      data: rows,
      total: count,
      page,
      limit,
    };
  }

  /**
   * Aggregate anomaly statistics for a branch over a date range (Req 9.4).
   *
   * Returns:
   * - totalByRiskLevel: count of records per risk level
   * - topFlagTypes: top 10 most frequent flag types across all records
   * - weeklyTrend: average risk score and count per ISO week
   */
  async getStatsByBranch(
    branchId: number,
    dateRange: DateRange,
  ): Promise<BranchAnomalyStats> {
    // Fetch all anomaly records for the branch in the date range
    const records = await InvoiceAnomalyResult.findAll({
      where: {
        analyzed_at: {
          [Op.gte]: dateRange.from,
          [Op.lte]: dateRange.to,
        },
      },
      include: [
        {
          model: InvoiceDocument,
          as: "document",
          where: { branch_id: branchId },
          required: true,
          attributes: ["id"],
        },
      ],
      attributes: ["risk_level", "risk_score", "flags", "analyzed_at"],
    });

    // Count by risk level
    const totalByRiskLevel: Record<RiskLevel, number> = {
      low_risk: 0,
      medium_risk: 0,
      high_risk: 0,
    };
    for (const record of records) {
      totalByRiskLevel[record.risk_level] =
        (totalByRiskLevel[record.risk_level] ?? 0) + 1;
    }

    // Count flag types across all records
    const flagTypeCounts = new Map<AnomalyFlagType, number>();
    for (const record of records) {
      for (const flag of record.flags ?? []) {
        flagTypeCounts.set(flag.type, (flagTypeCounts.get(flag.type) ?? 0) + 1);
      }
    }
    const topFlagTypes = Array.from(flagTypeCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([type, count]) => ({ type, count }));

    // Weekly trend: group by ISO week (YYYY-WW)
    const weeklyMap = new Map<string, { totalScore: number; count: number }>();
    for (const record of records) {
      const week = this.toIsoWeek(record.analyzed_at);
      const existing = weeklyMap.get(week) ?? { totalScore: 0, count: 0 };
      weeklyMap.set(week, {
        totalScore: existing.totalScore + record.risk_score,
        count: existing.count + 1,
      });
    }
    const weeklyTrend = Array.from(weeklyMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([week, { totalScore, count }]) => ({
        week,
        avgRiskScore: Math.round((totalScore / count) * 10000) / 10000,
        count,
      }));

    return { totalByRiskLevel, topFlagTypes, weeklyTrend };
  }

  /**
   * Record that a user confirmed a document despite anomaly warnings (Req 9.5).
   * Updates the most recent anomaly record for the document.
   */
  async recordOverride(documentId: number, userId: number): Promise<void> {
    const latest = await InvoiceAnomalyResult.findOne({
      where: { document_id: documentId },
      order: [["analyzed_at", "DESC"]],
    });

    if (!latest) return;

    await latest.update({
      override_by: userId,
      override_at: new Date(),
    });
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /**
   * Convert a Date to an ISO week string: "YYYY-WW".
   * Uses the ISO 8601 week numbering (Monday = first day of week).
   */
  private toIsoWeek(date: Date): string {
    const d = new Date(date);
    // Set to nearest Thursday (ISO week belongs to the year of its Thursday)
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(
      ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
    );
    return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
  }
}
