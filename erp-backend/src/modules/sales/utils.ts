import { ArInvoice } from "./models/arInvoice.model";
import { SaleOrder } from "./models/saleOrder.model";
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