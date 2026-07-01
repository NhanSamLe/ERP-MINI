import { OcrInvoiceData } from "../../types/ocr.types";
import { AnomalyFlag } from "../../types/anomaly.types";

/**
 * MathConsistencyChecker
 *
 * Kiểm tra tính nhất quán toán học của hóa đơn OCR:
 * 1. Tổng các dòng (sum of line amounts) so với subtotal
 * 2. subtotal + tax_amount so với total
 * 3. qty × unit_price so với amount của từng dòng
 *
 * Không cần DB, không async — thuần đồng bộ.
 */
export class MathConsistencyChecker {
  /**
   * Làm tròn giá trị về 2 chữ số thập phân.
   */
  private round2(value: number): number {
    return Math.round(value * 100) / 100;
  }

  /**
   * Kiểm tra tất cả các ràng buộc toán học và trả về danh sách AnomalyFlag.
   *
   * Quy trình so sánh:
   * - Tính giá trị computed (raw, chưa làm tròn)
   * - So sánh |computed - declared| > 0.01 trên giá trị raw
   * - Dùng round2 cho metadata/display
   */
  check(ocrData: OcrInvoiceData): AnomalyFlag[] {
    const flags: AnomalyFlag[] = [];

    // --- 2.2: Subtotal mismatch ---
    const rawComputedSubtotal = ocrData.items.reduce(
      (sum, item) => sum + item.amount,
      0,
    );
    const subtotalDiff = Math.abs(rawComputedSubtotal - ocrData.subtotal);

    if (subtotalDiff > 0.01) {
      const computedSubtotal = this.round2(rawComputedSubtotal);
      const declaredSubtotal = this.round2(ocrData.subtotal);
      flags.push({
        type: "subtotal_mismatch",
        severity: "high",
        description: `Tổng các dòng (${computedSubtotal}) không khớp với subtotal được khai báo (${declaredSubtotal}). Chênh lệch: ${this.round2(subtotalDiff)}.`,
        metadata: {
          computed: computedSubtotal,
          declared: declaredSubtotal,
          difference: this.round2(subtotalDiff),
        },
      });
    }

    // --- 2.3: Total mismatch ---
    const rawComputedTotal = ocrData.subtotal + ocrData.tax_amount;
    const totalDiff = Math.abs(rawComputedTotal - ocrData.total);

    if (totalDiff > 0.01) {
      const computedTotal = this.round2(rawComputedTotal);
      const declaredTotal = this.round2(ocrData.total);
      flags.push({
        type: "total_mismatch",
        severity: "high",
        description: `subtotal + tax_amount (${computedTotal}) không khớp với total được khai báo (${declaredTotal}). Chênh lệch: ${this.round2(totalDiff)}.`,
        metadata: {
          computed: computedTotal,
          declared: declaredTotal,
          difference: this.round2(totalDiff),
        },
      });
    }

    // --- 2.4: Line amount mismatch ---
    for (let i = 0; i < ocrData.items.length; i++) {
      const item = ocrData.items[i];
      if (!item) continue;

      const grossAmount = item.qty * item.unit_price;
      let discountValue = 0;
      if (item.discount_percent) {
        discountValue = (grossAmount * item.discount_percent) / 100;
      } else if (item.discount_amount) {
        discountValue = item.discount_amount;
      }

      const rawComputedAmount = grossAmount - discountValue;
      const lineDiff = Math.abs(rawComputedAmount - item.amount);

      if (lineDiff > 0.01) {
        const computedAmount = this.round2(rawComputedAmount);
        const declaredAmount = this.round2(item.amount);
        flags.push({
          type: "line_amount_mismatch",
          severity: "medium",
          lineItemIndex: i,
          description: `Dòng ${i} ("${item.name}"): số tiền tính toán (${computedAmount}) không khớp với amount được khai báo (${declaredAmount}). Chênh lệch: ${this.round2(lineDiff)}.`,
          metadata: {
            computed: computedAmount,
            declared: declaredAmount,
            difference: this.round2(lineDiff),
            itemName: item.name,
          },
        });
      }
    }

    return flags;
  }
}
