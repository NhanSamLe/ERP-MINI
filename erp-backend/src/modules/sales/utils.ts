import { ArInvoice } from "./models/arInvoice.model";
import { ArCreditNote } from "./models/arCreditNote.model";
import { ArRefund } from "./models/arRefund.model";
import { SaleOrder } from "./models/saleOrder.model";
import { SalesReturn } from "./models/salesReturn.model";
import { SalesReturnAuthorization } from "./models/salesReturnAuthorization.model";
import { Op } from "sequelize";

export async function generateOrderNo() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");

  const dateStr = `${yyyy}${mm}${dd}`;

  const count = await SaleOrder.count({
    where: {
      order_no: { [Op.like]: `SO-${dateStr}%` },
    },
  });

  const next = String(count + 1).padStart(4, "0");

  return `SO-${dateStr}-${next}`;
}

export async function generateInvoiceNo() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");

  const dateStr = `${yyyy}${mm}${dd}`;

  const count = await ArInvoice.count({
    where: {
      invoice_no: { [Op.like]: `INV-${dateStr}%` },
    },
  });

  const next = String(count + 1).padStart(4, "0");
  return `INV-${dateStr}-${next}`;
}

async function generateDailyNo(prefix: string, countModel: any, field: string) {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const dateStr = `${yyyy}${mm}${dd}`;

  const count = await countModel.count({
    where: {
      [field]: { [Op.like]: `${prefix}-${dateStr}%` },
    },
  });

  return `${prefix}-${dateStr}-${String(count + 1).padStart(4, "0")}`;
}

export function generateRmaNo() {
  return generateDailyNo("RMA", SalesReturnAuthorization, "rma_no");
}

export function generateReturnNo() {
  return generateDailyNo("SR", SalesReturn, "return_no");
}

export function generateCreditNoteNo() {
  return generateDailyNo("CN", ArCreditNote, "credit_note_no");
}

export function generateRefundNo() {
  return generateDailyNo("RF", ArRefund, "refund_no");
}
