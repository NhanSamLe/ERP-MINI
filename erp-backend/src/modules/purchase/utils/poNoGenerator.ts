/**
 * Tạo mã đơn mua hàng theo định dạng chuẩn: PO-YYYYMMDD-NNNN
 *
 * Ví dụ: PO-20260608-4371
 *
 * Format:
 *  - PO   : tiền tố cố định
 *  - YYYYMMDD : ngày tạo (năm-tháng-ngày)
 *  - NNNN : 4 chữ số ngẫu nhiên (1000-9999)
 */
export function generatePoNo(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000 + 1000); // 1000–9999
  return `PO-${y}${m}${d}-${rand}`;
}
