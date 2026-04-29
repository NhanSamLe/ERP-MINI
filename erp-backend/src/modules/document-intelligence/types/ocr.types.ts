export interface OcrRawResult {
  raw_text: string;
  structured_data: Record<string, any>;
  processing_time_ms: number;
}

export interface IOcrEngine {
  extract(filePath: string): Promise<OcrRawResult>;
}

export interface OcrLineItem {
  name: string;
  qty: number;
  unit: string;
  unit_price: number;
  tax_rate: number;
  amount: number;
  confidence: number;
  needsReview?: boolean;
}

export interface OcrInvoiceData {
  vendor_name: string;
  vendor_tax_code: string;
  invoice_no: string;
  invoice_series?: string;
  invoice_template?: string;
  invoice_date: string;
  items: OcrLineItem[];
  subtotal: number;
  tax_amount: number;
  total: number;
  confidence_scores: Record<string, number>;
  overall_confidence: number;
  warnings: string[];
}
