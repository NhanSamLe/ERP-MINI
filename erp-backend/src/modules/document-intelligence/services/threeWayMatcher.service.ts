import { Op } from "sequelize";
import { ApInvoice } from "../../purchase/models/apInvoice.model";
import { ApInvoiceLine } from "../../purchase/models/apInvoiceLine.model";
import { PurchaseOrderLine } from "../../purchase/models/purchaseOrderLine.model";
import { StockMove } from "../../inventory/models/stockMove.model";
import { StockMoveLine } from "../../inventory/models/stockMoveLine.model";
import { MatchingTolerance } from "../../purchase/models/matchingTolerance.model";
import { Product } from "../../product/models/product.model";

export interface LineMatchResult {
  ap_invoice_line_id: number;
  po_line_id?: number | undefined;
  status: "matched" | "price_mismatch" | "qty_mismatch";
  invoice_qty: number;
  po_qty: number;
  total_received: number;
  previously_invoiced: number;
  remaining_to_invoice: number;
  messages: string[];
}

export interface ThreeWayMatchResult {
  overall_status: "matched" | "mismatch" | "pending";
  line_results: LineMatchResult[];
  summary: {
    total_lines: number;
    matched_lines: number;
    price_mismatches: number;
    qty_mismatches: number;
  };
  message?: string;
}

export class ThreeWayMatcherService {
  async getTolerance(branchId: number, supplierId: number, categoryId?: number | null) {
    const rules = await MatchingTolerance.findAll({
      where: {
        branch_id: branchId,
        is_active: true,
        [Op.or]: [
          { supplier_id: supplierId },
          { category_id: categoryId ?? null },
          { supplier_id: null, category_id: null }
        ]
      },
      order: [["priority", "DESC"]],
    });

    if (rules.length === 0) {
      return { price_pct: 0, qty_pct: 0, amount_abs: 0 };
    }

    const rule = rules[0];
    if (!rule) {
      return { price_pct: 0, qty_pct: 0, amount_abs: 0 };
    }

    return {
      price_pct: Number(rule.price_tolerance_pct ?? 0),
      qty_pct: Number(rule.qty_tolerance_pct ?? 0),
      amount_abs: Number(rule.amount_tolerance_abs ?? 0),
    };
  }

  async match(ap_invoice_id: number): Promise<ThreeWayMatchResult> {
    // Step 1: Load ApInvoice with lines
    const invoice = await ApInvoice.findByPk(ap_invoice_id);
    if (!invoice) {
      throw new Error(`AP Invoice ${ap_invoice_id} not found`);
    }

    const invoiceLines = await ApInvoiceLine.findAll({
      where: { ap_invoice_id },
    });

    // Step 2: No PO linked
    if (!invoice.po_id) {
      return {
        overall_status: "pending",
        line_results: [],
        summary: {
          total_lines: 0,
          matched_lines: 0,
          price_mismatches: 0,
          qty_mismatches: 0,
        },
        message:
          "Hóa đơn không liên kết PO, không thể thực hiện 3-Way Matching",
      };
    }

    const po_id = invoice.po_id;
    const branchId = invoice.branch_id ?? 1;
    const supplierId = invoice.supplier_id ?? 0;

    // Step 3: Load all GRNs for this PO
    const grnMoves = await StockMove.findAll({
      where: {
        type: "receipt",
        reference_type: "purchase_order",
        reference_id: po_id,
        status: "posted",
      },
    });

    const grnMoveIds = grnMoves.map((m) => m.id);

    // Step 4: Load all GRN lines
    const grnLines =
      grnMoveIds.length > 0
        ? await StockMoveLine.findAll({
            where: { move_id: { [Op.in]: grnMoveIds } },
          })
        : [];

    // Step 5: Calculate total_received per product_id
    const totalReceived: Record<number, number> = {};
    for (const line of grnLines) {
      const pid = line.product_id;
      totalReceived[pid] =
        (totalReceived[pid] ?? 0) + Number(line.quantity ?? 0);
    }

    // Step 6: Calculate previously_invoiced per product_id
    // Other posted/paid AP invoices linked to same PO (excluding current invoice and cancelled ones)
    const otherInvoices = await ApInvoice.findAll({
      where: {
        po_id,
        status: { [Op.ne]: "cancelled" },
        id: { [Op.ne]: ap_invoice_id },
      },
    });

    const otherInvoiceIds = otherInvoices.map((inv) => inv.id);
    const otherLines =
      otherInvoiceIds.length > 0
        ? await ApInvoiceLine.findAll({
            where: { ap_invoice_id: { [Op.in]: otherInvoiceIds } },
          })
        : [];

    const previouslyInvoiced: Record<number, number> = {};
    for (const line of otherLines) {
      if (line.product_id) {
        previouslyInvoiced[line.product_id] =
          (previouslyInvoiced[line.product_id] ?? 0) +
          Number(line.quantity ?? 0);
      }
    }

    // Step 7: Load PO lines for matching
    const poLines = await PurchaseOrderLine.findAll({ where: { po_id } });
    const poLineByProduct: Record<number, PurchaseOrderLine> = {};
    for (const poLine of poLines) {
      if (poLine.product_id) {
        poLineByProduct[poLine.product_id] = poLine;
      }
    }

    // Step 8: Process each invoice line
    const lineResults: LineMatchResult[] = [];

    for (const invLine of invoiceLines) {
      const messages: string[] = [];
      const productId = invLine.product_id;
      const invoiceQty = Number(invLine.quantity ?? 0);
      const poLine = productId ? poLineByProduct[productId] : undefined;

      const received = productId ? (totalReceived[productId] ?? 0) : 0;
      const prevInvoiced = productId ? (previouslyInvoiced[productId] ?? 0) : 0;
      const remainingToInvoice = received - prevInvoiced;

      let categoryId: number | null = null;
      if (productId) {
        const prod = await Product.findByPk(productId, { attributes: ["category_id"] });
        categoryId = prod?.category_id ?? null;
      }

      const tolerance = await this.getTolerance(branchId, supplierId, categoryId);
      let status: "matched" | "price_mismatch" | "qty_mismatch" = "matched";

      if (!poLine) {
        status = "qty_mismatch";
        messages.push("Không tìm thấy dòng PO tương ứng");
      } else {
        const poQty = Number(poLine.quantity ?? 0);
        const poUnitPrice = Number(poLine.unit_price ?? 0);
        const invUnitPrice = Number(invLine.unit_price ?? 0);

        const diffQty = invoiceQty - remainingToInvoice;
        const qtyTolPct = tolerance.qty_pct;
        const allowedQtyLimit = remainingToInvoice * (1 + qtyTolPct / 100);

        if (invoiceQty > allowedQtyLimit && diffQty > 0) {
          status = "qty_mismatch";
          messages.push(
            `Số lượng hóa đơn (${invoiceQty}) vượt quá dung sai số lượng cho phép (${qtyTolPct}%, giới hạn: ${allowedQtyLimit}) dựa trên lượng còn lại (${remainingToInvoice})`,
          );
        }

        const priceDiffAbs = Math.abs(invUnitPrice - poUnitPrice);
        const priceDiffPct = poUnitPrice > 0 ? (priceDiffAbs / poUnitPrice * 100) : 0;
        const amountDiffAbs = priceDiffAbs * invoiceQty;

        const priceTolPct = tolerance.price_pct;
        const amountTolAbs = tolerance.amount_abs;

        if (priceDiffAbs > 0 && priceDiffPct > priceTolPct && amountDiffAbs > amountTolAbs) {
          if (status === "matched") {
            status = "price_mismatch";
          }
          messages.push(
            `Đơn giá hóa đơn (${invUnitPrice}) lệch đơn giá PO (${poUnitPrice}) vượt dung sai cho phép (${priceTolPct}%, lệch tiền: ${amountDiffAbs} > ${amountTolAbs})`,
          );
        }

        lineResults.push({
          ap_invoice_line_id: invLine.id,
          po_line_id: poLine.id,
          status,
          invoice_qty: invoiceQty,
          po_qty: poQty,
          total_received: received,
          previously_invoiced: prevInvoiced,
          remaining_to_invoice: remainingToInvoice,
          messages,
        });
        continue;
      }

      lineResults.push({
        ap_invoice_line_id: invLine.id,
        po_line_id: undefined,
        status,
        invoice_qty: invoiceQty,
        po_qty: 0,
        total_received: received,
        previously_invoiced: prevInvoiced,
        remaining_to_invoice: remainingToInvoice,
        messages,
      });
    }

    // Build summary
    const summary = {
      total_lines: lineResults.length,
      matched_lines: lineResults.filter((r) => r.status === "matched").length,
      price_mismatches: lineResults.filter((r) => r.status === "price_mismatch")
        .length,
      qty_mismatches: lineResults.filter((r) => r.status === "qty_mismatch")
        .length,
    };

    const overall_status: "matched" | "mismatch" =
      summary.price_mismatches > 0 || summary.qty_mismatches > 0
        ? "mismatch"
        : "matched";

    // Step 9: Persist results
    await invoice.update({
      matching_status: overall_status,
      matching_details: { summary, line_results: lineResults },
    });

    for (const result of lineResults) {
      await ApInvoiceLine.update(
        { matching_result: result.status },
        { where: { id: result.ap_invoice_line_id } },
      );
    }

    return { overall_status, line_results: lineResults, summary };
  }
}
