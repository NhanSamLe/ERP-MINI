import { Op } from "sequelize";
import { ApInvoice } from "../../../purchase/models/apInvoice.model";
import { AnomalyFlag, ThresholdConfig } from "../../types/anomaly.types";
import { OcrInvoiceData } from "../../types/ocr.types";

/**
 * FraudPatternDetector detects fraud-related patterns in OCR invoice data.
 *
 * Checks performed:
 * 1. Approval threshold proximity (6.2)
 * 2. High frequency invoicing in last 24h (6.3)
 * 3. Round number with no line item detail (6.4)
 * 4. Rejected/cancelled pattern match by invoice_no prefix (6.5)
 * 5. Period-end spike vs vendor average (6.6)
 *
 * Requirements: 4.1–4.6
 */
export class FraudPatternDetector {
  /**
   * Run all fraud pattern checks and return the combined list of AnomalyFlags.
   * Each check is wrapped in a try-catch so a single failure does not abort the rest.
   */
  async detect(
    ocrData: OcrInvoiceData,
    branchId: number,
    config: ThresholdConfig,
  ): Promise<AnomalyFlag[]> {
    const flags: AnomalyFlag[] = [];

    // 6.2 — Approval threshold proximity
    try {
      const proximityFlag = this.checkApprovalThresholdProximity(
        ocrData,
        config,
      );
      if (proximityFlag) flags.push(proximityFlag);
    } catch (err) {
      // fail-safe: skip this check
    }

    // 6.3 — High frequency invoicing
    try {
      const freqFlag = await this.checkHighFrequencyInvoicing(
        ocrData,
        branchId,
      );
      if (freqFlag) flags.push(freqFlag);
    } catch (err) {
      // fail-safe: skip this check
    }

    // 6.4 — Round number with no detail
    try {
      const roundFlag = this.checkRoundNumberNoDetail(ocrData);
      if (roundFlag) flags.push(roundFlag);
    } catch (err) {
      // fail-safe: skip this check
    }

    // 6.5 — Rejected pattern match
    try {
      const rejectedFlag = await this.checkRejectedPatternMatch(
        ocrData,
        branchId,
      );
      if (rejectedFlag) flags.push(rejectedFlag);
    } catch (err) {
      // fail-safe: skip this check
    }

    // 6.6 — Period-end spike
    try {
      const periodEndFlag = await this.checkPeriodEndSpike(ocrData, branchId);
      if (periodEndFlag) flags.push(periodEndFlag);
    } catch (err) {
      // fail-safe: skip this check
    }

    return flags;
  }

  // ---------------------------------------------------------------------------
  // 6.2 — Approval threshold proximity
  // ---------------------------------------------------------------------------

  /**
   * Flags invoices whose total is between 95% and 100% of the approval threshold.
   * Disabled when approvalThresholdVnd = 0.
   */
  private checkApprovalThresholdProximity(
    ocrData: OcrInvoiceData,
    config: ThresholdConfig,
  ): AnomalyFlag | null {
    const threshold = config.approvalThresholdVnd;
    if (threshold <= 0) return null;

    const total = ocrData.total;
    const lowerBound = 0.95 * threshold;

    if (total >= lowerBound && total <= threshold) {
      const proximityPct = ((total / threshold) * 100).toFixed(2);
      return {
        type: "approval_threshold_proximity",
        severity: "high",
        description: `Invoice total ${total} is within 5% of approval threshold ${threshold} (${proximityPct}%)`,
        metadata: {
          total,
          threshold,
          proximity_pct: proximityPct,
        },
      };
    }

    return null;
  }

  // ---------------------------------------------------------------------------
  // 6.3 — High frequency invoicing
  // ---------------------------------------------------------------------------

  /**
   * Counts non-cancelled AP invoices for the same branch in the last 24 hours.
   * > 3  → medium
   * > 10 → critical
   */
  private async checkHighFrequencyInvoicing(
    ocrData: OcrInvoiceData,
    branchId: number,
  ): Promise<AnomalyFlag | null> {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const count = await ApInvoice.count({
      where: {
        branch_id: branchId,
        created_at: { [Op.gte]: since },
        status: { [Op.notIn]: ["cancelled"] },
      } as any,
    }) as number;

    if (count > 10) {
      return {
        type: "high_frequency_invoicing",
        severity: "critical",
        description: `${count} invoices submitted in the last 24 hours for this branch (threshold: >10)`,
        metadata: { count, branchId, windowHours: 24 },
      };
    }

    if (count > 3) {
      return {
        type: "high_frequency_invoicing",
        severity: "medium",
        description: `${count} invoices submitted in the last 24 hours for this branch (threshold: >3)`,
        metadata: { count, branchId, windowHours: 24 },
      };
    }

    return null;
  }

  // ---------------------------------------------------------------------------
  // 6.4 — Round number with no detail
  // ---------------------------------------------------------------------------

  /**
   * Flags invoices with a round total (divisible by 1,000,000) and no line items.
   */
  private checkRoundNumberNoDetail(
    ocrData: OcrInvoiceData,
  ): AnomalyFlag | null {
    const total = ocrData.total;
    if (total % 1_000_000 === 0 && ocrData.items.length === 0) {
      return {
        type: "round_number_no_detail",
        severity: "low",
        description: `Invoice total ${total} is a round number with no line item detail`,
        metadata: { total },
      };
    }
    return null;
  }

  // ---------------------------------------------------------------------------
  // 6.5 — Rejected pattern match
  // ---------------------------------------------------------------------------

  /**
   * Checks if any cancelled AP invoice in the same branch shares the first 6
   * characters of the current invoice_no.
   */
  private async checkRejectedPatternMatch(
    ocrData: OcrInvoiceData,
    branchId: number,
  ): Promise<AnomalyFlag | null> {
    const invoiceNo = ocrData.invoice_no;
    if (!invoiceNo || invoiceNo.length < 6) return null;

    const prefix = invoiceNo.substring(0, 6);

    const match = await ApInvoice.findOne({
      where: {
        branch_id: branchId,
        status: "cancelled",
        invoice_no: { [Op.like]: `${prefix}%` },
      },
      attributes: ["invoice_no"],
    });

    if (match) {
      return {
        type: "rejected_pattern_match",
        severity: "high",
        description: `Invoice number prefix "${prefix}" matches a previously cancelled invoice (${match.invoice_no})`,
        metadata: {
          matchedInvoiceNo: match.invoice_no,
          pattern: prefix,
        },
      };
    }

    return null;
  }

  // ---------------------------------------------------------------------------
  // 6.6 — Period-end spike
  // ---------------------------------------------------------------------------

  /**
   * Flags invoices dated on the last day of a month or quarter whose total
   * exceeds 200% of the vendor's average invoice total in the same branch.
   */
  private async checkPeriodEndSpike(
    ocrData: OcrInvoiceData,
    branchId: number,
  ): Promise<AnomalyFlag | null> {
    if (!ocrData.invoice_date) return null;

    const invoiceDate = new Date(ocrData.invoice_date);
    if (isNaN(invoiceDate.getTime())) return null;

    if (!this.isPeriodEnd(invoiceDate)) return null;

    // Compute vendor average total_after_tax for the same branch
    const vendorAverage = await this.getVendorAverageTotal(
      ocrData.vendor_tax_code,
      branchId,
    );

    if (vendorAverage <= 0) return null;

    const total = ocrData.total;
    const ratio = total / vendorAverage;

    if (ratio > 2.0) {
      return {
        type: "period_end_spike",
        severity: "medium",
        description: `Invoice total ${total} is ${(ratio * 100).toFixed(2)}% of vendor average ${vendorAverage.toFixed(2)} on a period-end date`,
        metadata: {
          total,
          vendorAverage,
          ratio: ratio.toFixed(2),
          isPeriodEnd: true,
        },
      };
    }

    return null;
  }

  /**
   * Returns true if the given date is the last day of a month or the last day
   * of a quarter (Q1=Mar, Q2=Jun, Q3=Sep, Q4=Dec).
   */
  private isPeriodEnd(date: Date): boolean {
    const year = date.getFullYear();
    const month = date.getMonth(); // 0-indexed
    const day = date.getDate();

    // Last day of the current month
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    if (day !== lastDayOfMonth) return false;

    // It is the last day of the month — always a month-end
    // Additionally check if it is a quarter-end (month 2, 5, 8, 11 in 0-indexed = Mar, Jun, Sep, Dec)
    return true;
  }

  /**
   * Queries the average total_after_tax for the vendor (matched by tax_code)
   * in the given branch across all non-cancelled invoices.
   */
  private async getVendorAverageTotal(
    vendorTaxCode: string,
    branchId: number,
  ): Promise<number> {
    if (!vendorTaxCode) return 0;

    const invoices = await ApInvoice.findAll({
      where: {
        branch_id: branchId,
        tax_code: vendorTaxCode,
        status: { [Op.notIn]: ["cancelled"] },
        total_after_tax: { [Op.not]: null },
      } as any,
      attributes: ["total_after_tax"],
    });

    if (invoices.length === 0) return 0;

    const sum = invoices.reduce(
      (acc, inv) => acc + Number(inv.total_after_tax ?? 0),
      0,
    );
    return sum / invoices.length;
  }
}
