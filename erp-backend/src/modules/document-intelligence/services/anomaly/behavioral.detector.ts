import { Op } from "sequelize";
import { ApInvoice } from "../../../purchase/models/apInvoice.model";
import { Partner } from "../../../partner/models/partner.model";
import { AnomalyFlag } from "../../types/anomaly.types";
import { OcrInvoiceData } from "../../types/ocr.types";

/**
 * BehavioralAnomalyDetector detects behavioral anomalies in OCR invoice data.
 *
 * Checks performed:
 * 1. New vendor check (7.2) — no prior invoices for this tax_code in branch
 * 2. Dormant vendor check (7.3) — last transaction > 365 days ago
 * 3. Weekend high value check (7.4) — Saturday/Sunday with total > 10,000,000 VND
 * 4. Future dated check (7.5) — invoice_date > processingDate
 * 5. Stale invoice check (7.6) — invoice_date < processingDate - 90 days
 * 6. Tax code change check (7.7) — vendor name found in Partner with different tax_code
 *
 * Requirements: 5.1–5.6
 */
export class BehavioralAnomalyDetector {
  /**
   * Run all behavioral anomaly checks and return the combined list of AnomalyFlags.
   * Each check is wrapped in a try-catch so a single failure does not abort the rest.
   */
  async detect(
    ocrData: OcrInvoiceData,
    branchId: number,
    processingDate: Date,
  ): Promise<AnomalyFlag[]> {
    const flags: AnomalyFlag[] = [];

    // 7.2 — New vendor check
    try {
      const newVendorFlag = await this.checkNewVendor(ocrData, branchId);
      if (newVendorFlag) flags.push(newVendorFlag);
    } catch (_err) {
      // fail-safe: skip this check
    }

    // 7.3 — Dormant vendor check
    try {
      const dormantFlag = await this.checkDormantVendor(
        ocrData,
        branchId,
        processingDate,
      );
      if (dormantFlag) flags.push(dormantFlag);
    } catch (_err) {
      // fail-safe: skip this check
    }

    // 7.4 — Weekend high value check
    try {
      const weekendFlag = this.checkWeekendHighValue(ocrData);
      if (weekendFlag) flags.push(weekendFlag);
    } catch (_err) {
      // fail-safe: skip this check
    }

    // 7.5 — Future dated check
    try {
      const futureDatedFlag = this.checkFutureDated(ocrData, processingDate);
      if (futureDatedFlag) flags.push(futureDatedFlag);
    } catch (_err) {
      // fail-safe: skip this check
    }

    // 7.6 — Stale invoice check
    try {
      const staleFlag = this.checkStaleInvoice(ocrData, processingDate);
      if (staleFlag) flags.push(staleFlag);
    } catch (_err) {
      // fail-safe: skip this check
    }

    // 7.7 — Tax code change check
    try {
      const taxCodeChangeFlag = await this.checkVendorTaxCodeChange(ocrData);
      if (taxCodeChangeFlag) flags.push(taxCodeChangeFlag);
    } catch (_err) {
      // fail-safe: skip this check
    }

    return flags;
  }

  private async checkNewVendor(
    ocrData: OcrInvoiceData,
    branchId: number,
  ): Promise<AnomalyFlag | null> {
    if (!ocrData.vendor_tax_code) return null;

    const count = await ApInvoice.count({
      where: {
        branch_id: branchId,
        tax_code: ocrData.vendor_tax_code,
      },
    });

    if (count === 0) {
      return {
        type: "new_vendor",
        severity: "low",
        description: `No previous invoices found for vendor with tax code "${ocrData.vendor_tax_code}" in this branch`,
        metadata: { vendorTaxCode: ocrData.vendor_tax_code },
      };
    }

    return null;
  }

  private async checkDormantVendor(
    ocrData: OcrInvoiceData,
    branchId: number,
    processingDate: Date,
  ): Promise<AnomalyFlag | null> {
    if (!ocrData.vendor_tax_code) return null;

    const lastInvoice = await ApInvoice.findOne({
      where: {
        branch_id: branchId,
        tax_code: ocrData.vendor_tax_code,
      },
      order: [["invoice_date", "DESC"]],
      attributes: ["invoice_date"],
    });

    if (!lastInvoice || !lastInvoice.invoice_date) return null;

    const lastTransactionDate = new Date(lastInvoice.invoice_date);
    const msPerDay = 24 * 60 * 60 * 1000;
    const daysSinceLastTransaction = Math.floor(
      (processingDate.getTime() - lastTransactionDate.getTime()) / msPerDay,
    );

    if (daysSinceLastTransaction > 365) {
      return {
        type: "dormant_vendor_reactivation",
        severity: "medium",
        description: `Vendor with tax code "${ocrData.vendor_tax_code}" has been dormant for ${daysSinceLastTransaction} days`,
        metadata: {
          lastTransactionDate: lastTransactionDate.toISOString().split("T")[0],
          daysSinceLastTransaction,
        },
      };
    }

    return null;
  }

  private checkWeekendHighValue(ocrData: OcrInvoiceData): AnomalyFlag | null {
    if (!ocrData.invoice_date) return null;

    const invoiceDate = new Date(ocrData.invoice_date);
    if (isNaN(invoiceDate.getTime())) return null;

    const dayOfWeek = invoiceDate.getDay(); // 0 = Sunday, 6 = Saturday
    const total = ocrData.total;

    if ((dayOfWeek === 0 || dayOfWeek === 6) && total > 10_000_000) {
      return {
        type: "weekend_high_value",
        severity: "low",
        description: `High-value invoice (${total.toLocaleString()} VND) dated on a weekend`,
        metadata: {
          invoiceDate: ocrData.invoice_date,
          total,
          dayOfWeek,
        },
      };
    }

    return null;
  }

  private checkFutureDated(
    ocrData: OcrInvoiceData,
    processingDate: Date,
  ): AnomalyFlag | null {
    if (!ocrData.invoice_date) return null;

    const invoiceDate = new Date(ocrData.invoice_date);
    if (isNaN(invoiceDate.getTime())) return null;

    const invoiceDateOnly = new Date(
      invoiceDate.getFullYear(),
      invoiceDate.getMonth(),
      invoiceDate.getDate(),
    );
    const processingDateOnly = new Date(
      processingDate.getFullYear(),
      processingDate.getMonth(),
      processingDate.getDate(),
    );

    if (invoiceDateOnly > processingDateOnly) {
      return {
        type: "future_dated_invoice",
        severity: "medium",
        description: `Invoice date "${ocrData.invoice_date}" is in the future`,
        metadata: {
          invoiceDate: ocrData.invoice_date,
          processingDate: processingDate.toISOString().split("T")[0],
        },
      };
    }

    return null;
  }

  private checkStaleInvoice(
    ocrData: OcrInvoiceData,
    processingDate: Date,
  ): AnomalyFlag | null {
    if (!ocrData.invoice_date) return null;

    const invoiceDate = new Date(ocrData.invoice_date);
    if (isNaN(invoiceDate.getTime())) return null;

    const msPerDay = 24 * 60 * 60 * 1000;
    const daysOld = Math.floor(
      (processingDate.getTime() - invoiceDate.getTime()) / msPerDay,
    );

    if (daysOld > 90) {
      return {
        type: "stale_invoice",
        severity: "low",
        description: `Invoice date "${ocrData.invoice_date}" is ${daysOld} days old (threshold: 90 days)`,
        metadata: {
          invoiceDate: ocrData.invoice_date,
          processingDate: processingDate.toISOString().split("T")[0],
          daysOld,
        },
      };
    }

    return null;
  }

  private async checkVendorTaxCodeChange(
    ocrData: OcrInvoiceData,
  ): Promise<AnomalyFlag | null> {
    if (!ocrData.vendor_name || !ocrData.vendor_tax_code) return null;

    const partner = await Partner.findOne({
      where: {
        name: { [Op.iLike]: ocrData.vendor_name },
      },
      attributes: ["name", "tax_code"],
    });

    if (!partner) return null;

    if (partner.tax_code && partner.tax_code !== ocrData.vendor_tax_code) {
      return {
        type: "vendor_tax_code_change",
        severity: "high",
        description: `Vendor "${ocrData.vendor_name}" has a different tax code in the system: stored "${partner.tax_code}" vs OCR "${ocrData.vendor_tax_code}"`,
        metadata: {
          vendorName: ocrData.vendor_name,
          currentTaxCode: ocrData.vendor_tax_code,
          storedTaxCode: partner.tax_code,
        },
      };
    }

    return null;
  }
}
