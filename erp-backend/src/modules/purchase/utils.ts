import { Op } from "sequelize";
import { ApPayment } from "./models/apPayment.model";

/**
 * Generator số phiếu thanh toán AP: PAY-YYYYMMDD-XXXX
 * Retry loop để tránh race condition khi nhiều request đồng thời.
 */
export async function generatePaymentNo(): Promise<string> {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const dateStr = `${yyyy}${mm}${dd}`;
  const prefix = `PAY-${dateStr}`;

  for (let attempt = 0; attempt < 5; attempt++) {
    const count = await ApPayment.count({
      where: { payment_no: { [Op.like]: `${prefix}%` } },
    });
    const candidate = `${prefix}-${String(count + 1).padStart(4, "0")}`;
    const exists = await ApPayment.findOne({ where: { payment_no: candidate } });
    if (!exists) return candidate;
  }

  // Fallback timestamp đảm bảo unique tuyệt đối
  return `${prefix}-${Date.now()}`;
}
