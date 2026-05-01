import { OcrRawResult, OcrInvoiceData, OcrLineItem } from "../types/ocr.types";

// Weights for overall_confidence calculation
const FIELD_WEIGHTS = {
  invoice_no: 0.25,
  vendor_tax_code: 0.25,
  total: 0.2,
  items: 0.3,
} as const;

function fieldConfidence(value: any): number {
  if (value === undefined || value === null) return 0.0;
  if (typeof value === "string" && value.trim() === "") return 0.0;
  if (typeof value === "number" && isNaN(value)) return 0.0;
  return 0.9;
}

function itemConfidence(item: any): number {
  const fields = ["name", "qty", "unit", "unit_price", "tax_rate", "amount"];
  const scores = fields.map((f) => fieldConfidence(item?.[f]));
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

export class InvoiceParser {
  parseOcrResult(rawResult: OcrRawResult): OcrInvoiceData {
    const data = rawResult.structured_data ?? {};

    // Parse items
    const rawItems: any[] = Array.isArray(data.items) ? data.items : [];
    const items: OcrLineItem[] = rawItems.map((item) => {
      const conf = itemConfidence(item);
      return {
        name: item.name ?? "",
        qty: Number(item.qty) || 0,
        unit: item.unit ?? "",
        unit_price: Number(item.unit_price) || 0,
        tax_rate: Number(item.tax_rate) || 0,
        amount: Number(item.amount) || 0,
        confidence: conf,
        needsReview: conf < 0.7,
      };
    });

    // Per-field confidence scores
    const confidence_scores: {
      vendor_name: number;
      vendor_tax_code: number;
      invoice_no: number;
      invoice_series: number;
      invoice_template: number;
      invoice_date: number;
      subtotal: number;
      tax_amount: number;
      total: number;
    } = {
      vendor_name: fieldConfidence(data.vendor_name),
      vendor_tax_code: fieldConfidence(data.vendor_tax_code),
      invoice_no: fieldConfidence(data.invoice_no),
      invoice_series: fieldConfidence(data.invoice_series),
      invoice_template: fieldConfidence(data.invoice_template),
      invoice_date: fieldConfidence(data.invoice_date),
      subtotal: fieldConfidence(data.subtotal),
      tax_amount: fieldConfidence(data.tax_amount),
      total: fieldConfidence(data.total),
    };

    // Average confidence across items
    const items_avg_confidence =
      items.length > 0
        ? items.reduce((sum, it) => sum + it.confidence, 0) / items.length
        : 0.0;

    // Weighted overall_confidence
    const overall_confidence =
      FIELD_WEIGHTS.invoice_no * confidence_scores.invoice_no +
      FIELD_WEIGHTS.vendor_tax_code * confidence_scores.vendor_tax_code +
      FIELD_WEIGHTS.total * confidence_scores.total +
      FIELD_WEIGHTS.items * items_avg_confidence;

    // Warnings
    const warnings: string[] = [];
    if (overall_confidence < 0.7) {
      warnings.push(
        "Chất lượng hóa đơn thấp, vui lòng kiểm tra lại toàn bộ thông tin",
      );
    }

    return {
      vendor_name: data.vendor_name ?? "",
      vendor_tax_code: data.vendor_tax_code ?? "",
      invoice_no: data.invoice_no ?? "",
      invoice_series: data.invoice_series ?? undefined,
      invoice_template: data.invoice_template ?? undefined,
      invoice_date: data.invoice_date ?? "",
      items,
      subtotal: Number(data.subtotal) || 0,
      tax_amount: Number(data.tax_amount) || 0,
      total: Number(data.total) || 0,
      confidence_scores,
      overall_confidence,
      warnings,
    };
  }
}
