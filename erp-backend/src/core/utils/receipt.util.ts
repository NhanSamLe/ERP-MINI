import { ArReceipt } from "../../models";
import { Op } from "sequelize";

export async function generateReceiptNo() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");

  const prefix = `RC-${yyyy}${mm}${dd}`;

  const latest = await ArReceipt.findOne({
    where: { receipt_no: { [Op.like]: `${prefix}%` } },
    order: [["id", "DESC"]],
  });

  let seq = 1;

  if (latest) {
    const last4 = Number(latest.receipt_no.slice(-4));
    seq = last4 + 1;
  }

  return `${prefix}-${String(seq).padStart(4, "0")}`;
}
