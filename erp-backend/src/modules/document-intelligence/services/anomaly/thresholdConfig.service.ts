import { AnomalyThresholdConfig } from "../../models/anomalyThresholdConfig.model";
import { ThresholdConfig } from "../../types/anomaly.types";

/**
 * Default threshold values applied when no branch-specific config exists.
 * Requirements 10.2, Property 12: Default Config Fallback
 */
const DEFAULT_THRESHOLD_CONFIG: Omit<ThresholdConfig, "branchId"> = {
  zScoreThreshold: 3.0,
  iqrMultiplier: 1.5,
  frequencyThresholdPerHour: 3,
  approvalThresholdVnd: 0,
  highRiskScoreThreshold: 0.7,
  mediumRiskScoreThreshold: 0.4,
};

/**
 * Manages per-branch anomaly detection threshold configuration.
 *
 * Responsibilities:
 * - Return branch-specific config, falling back to system defaults when none exists
 * - Validate config values before persisting
 * - Upsert config records in the database
 *
 * Requirements 10.1, 10.2, 10.3, 10.4
 */
export class ThresholdConfigService {
  /**
   * Retrieve the threshold configuration for a branch.
   * Falls back to system-wide defaults when no custom config exists.
   */
  async getConfig(branchId: number): Promise<ThresholdConfig> {
    const record = await AnomalyThresholdConfig.findOne({
      where: { branch_id: branchId },
    });

    if (!record) {
      return { branchId, ...DEFAULT_THRESHOLD_CONFIG };
    }

    return {
      branchId: record.branch_id,
      zScoreThreshold: record.z_score_threshold,
      iqrMultiplier: record.iqr_multiplier,
      frequencyThresholdPerHour: record.frequency_threshold_per_hour,
      approvalThresholdVnd: record.approval_threshold_vnd,
      highRiskScoreThreshold: record.high_risk_score_threshold,
      mediumRiskScoreThreshold: record.medium_risk_score_threshold,
    };
  }

  /**
   * Validate and upsert the threshold configuration for a branch.
   * Throws an Error with a descriptive message if any value is out of range.
   */
  async updateConfig(
    branchId: number,
    params: Partial<Omit<ThresholdConfig, "branchId">>,
    updatedBy: number,
  ): Promise<ThresholdConfig> {
    this.validate(params);

    const existing = await AnomalyThresholdConfig.findOne({
      where: { branch_id: branchId },
    });

    const base = existing
      ? {
          zScoreThreshold: existing.z_score_threshold,
          iqrMultiplier: existing.iqr_multiplier,
          frequencyThresholdPerHour: existing.frequency_threshold_per_hour,
          approvalThresholdVnd: existing.approval_threshold_vnd,
          highRiskScoreThreshold: existing.high_risk_score_threshold,
          mediumRiskScoreThreshold: existing.medium_risk_score_threshold,
        }
      : { ...DEFAULT_THRESHOLD_CONFIG };

    const merged = { ...base, ...params };

    const [record] = await AnomalyThresholdConfig.upsert({
      branch_id: branchId,
      z_score_threshold: merged.zScoreThreshold,
      iqr_multiplier: merged.iqrMultiplier,
      frequency_threshold_per_hour: merged.frequencyThresholdPerHour,
      approval_threshold_vnd: merged.approvalThresholdVnd,
      high_risk_score_threshold: merged.highRiskScoreThreshold,
      medium_risk_score_threshold: merged.mediumRiskScoreThreshold,
      created_by: existing ? existing.created_by : updatedBy,
      updated_by: updatedBy,
    });

    return {
      branchId: record.branch_id,
      zScoreThreshold: record.z_score_threshold,
      iqrMultiplier: record.iqr_multiplier,
      frequencyThresholdPerHour: record.frequency_threshold_per_hour,
      approvalThresholdVnd: record.approval_threshold_vnd,
      highRiskScoreThreshold: record.high_risk_score_threshold,
      mediumRiskScoreThreshold: record.medium_risk_score_threshold,
    };
  }

  /**
   * Validate threshold config params.
   * Throws an Error with a descriptive message for any out-of-range value.
   * Requirements 10.4, Property 11
   */
  private validate(params: Partial<Omit<ThresholdConfig, "branchId">>): void {
    if (params.zScoreThreshold !== undefined) {
      if (params.zScoreThreshold < 1.0 || params.zScoreThreshold > 10.0) {
        throw new Error("zScoreThreshold must be between 1.0 and 10.0");
      }
    }

    if (params.iqrMultiplier !== undefined) {
      if (params.iqrMultiplier < 0.5 || params.iqrMultiplier > 5.0) {
        throw new Error("iqrMultiplier must be between 0.5 and 5.0");
      }
    }

    if (params.frequencyThresholdPerHour !== undefined) {
      if (
        params.frequencyThresholdPerHour < 1 ||
        params.frequencyThresholdPerHour > 100
      ) {
        throw new Error("frequencyThresholdPerHour must be between 1 and 100");
      }
    }

    if (params.approvalThresholdVnd !== undefined) {
      if (params.approvalThresholdVnd < 0) {
        throw new Error("approvalThresholdVnd must be >= 0");
      }
    }

    if (params.highRiskScoreThreshold !== undefined) {
      if (
        params.highRiskScoreThreshold < 0.1 ||
        params.highRiskScoreThreshold > 1.0
      ) {
        throw new Error("highRiskScoreThreshold must be between 0.1 and 1.0");
      }
    }

    if (params.mediumRiskScoreThreshold !== undefined) {
      if (
        params.mediumRiskScoreThreshold < 0.1 ||
        params.mediumRiskScoreThreshold > 1.0
      ) {
        throw new Error("mediumRiskScoreThreshold must be between 0.1 and 1.0");
      }
    }

    // Cross-field: medium must be strictly less than high
    const high = params.highRiskScoreThreshold;
    const medium = params.mediumRiskScoreThreshold;
    if (high !== undefined && medium !== undefined && medium >= high) {
      throw new Error(
        "mediumRiskScoreThreshold must be less than highRiskScoreThreshold",
      );
    }
  }
}
