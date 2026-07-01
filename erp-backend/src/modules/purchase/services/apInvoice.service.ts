import { Role } from "../../../core/types/enum";
import {
  ApInvoiceLine,
  Partner,
  Product,
  sequelize,
  TaxRate,
  PaymentTerm,
  Currency,
} from "../../../models";
import { User } from "../../auth/models/user.model";
import { Branch } from "../../company/models/branch.model";
import { ApInvoice } from "../models/apInvoice.model";
import { PurchaseOrder } from "../models/purchaseOrder.model";
import { PurchaseOrderLine } from "../models/purchaseOrderLine.model";
import { Transaction, Op } from "sequelize";
import { GlJournal } from "../../finance/models/glJournal.model";
import { GlEntry } from "../../finance/models/glEntry.model";
import { GlEntryLine } from "../../finance/models/glEntryLine.model";
import { notificationService } from "../../../core/services/notification.service";
import { getMappedAccount } from "../../finance/services/glAccount.service";
import { checkPeriodLocked } from "../../finance/services/glJournal.service";
import { requireGlAccounts } from "../../finance/services/glAccount.helper";
import { getCompanyIdFromBranch, getCompanyBranchIds } from "../../finance/services/companyScope.service";
import { DuplicateDetectorService } from "../../document-intelligence/services/duplicateDetector.service";
import { ThreeWayMatcherService } from "../../document-intelligence/services/threeWayMatcher.service";
import { apInvoiceAuditLogService } from "./apInvoiceAuditLog.service";
import { logger } from "../../../config/logger";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateAPInvoiceLineInput {
  product_id: number | null;
  description?: string;
  quantity: number;
  unit_price: number;
  tax_rate_id?: number | null;
  line_total?: number;
  line_tax?: number;
  line_total_after_tax?: number;
  po_line_id?: number | null;
  grn_line_id?: number | null;
  uom_id?: number | null;
}

export interface CreateAPInvoiceInput {
  source: "manual" | "ai_ocr";
  invoice_no: string;
  invoice_date: Date;
  due_date?: Date | undefined;
  supplier_id: number;
  po_id?: number | null;
  branch_id: number;
  created_by: number;
  invoice_document_id?: number | null;
  ocr_confidence?: number | null;
  invoice_series?: string | null;
  invoice_template?: string | null;
  tax_code?: string | null;
  total_before_tax?: number;
  total_tax?: number;
  total_after_tax?: number;
  lines: CreateAPInvoiceLineInput[];
  payment_term_id?: number | null;
  currency_id?: number | null;
  exchange_rate?: number | null;
  // Cho phép ghi đè cảnh báo trùng lặp
  overrideDuplicate?: boolean;
  override_reason?: string;
}

export interface CreateAPInvoiceResult {
  invoice: ApInvoice;
  duplicateWarning?: {
    existingInvoiceId: number;
    existingInvoiceDate?: Date;
    message: string;
  };
  matchingResult?: {
    overall_status: string;
    summary: Record<string, any>;
  };
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const apInvoiceService = {
  // ─── READ ──────────────────────────────────────────────────────────────────

  async getAll(query: any, user: any) {
    // Delegate to enhanced filter method — backward compatible
    return this.getAllWithFilters(query, user);
  },

  async getById(id: number, user: any) {
    const companyBranchIds = await getCompanyBranchIds(user);
    const where: any = { id };
    if (user.role === "ADMIN" || user.role === "CEO") {
      where.branch_id = { [Op.in]: companyBranchIds };
    } else {
      where.branch_id = user.branch_id;
    }
 
    if (user.role === "ACCOUNT") {
      where.created_by = user.id;
    }

    return ApInvoice.findOne({
      where,
      include: [
        { model: Branch, as: "branch" },
        {
          model: User,
          as: "creator",
          attributes: ["id", "full_name", "email", "phone", "avatar_url"],
        },
        {
          model: User,
          as: "approver",
          attributes: ["id", "full_name", "email", "phone", "avatar_url"],
        },
        {
          model: PaymentTerm,
          as: "paymentTerm",
          attributes: ["id", "name", "days", "code"],
        },
        {
          model: Currency,
          as: "currency",
          attributes: ["id", "code", "symbol", "name"],
        },
        {
          model: ApInvoiceLine,
          as: "lines",
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["id", "name", "image_url"],
            },
          ],
        },
        {
          model: PurchaseOrder,
          as: "order",
          include: [
            {
              model: Partner,
              as: "supplier",
              attributes: ["id", "name", "email", "phone"],
            },
            {
              model: PurchaseOrderLine,
              as: "lines",
            },
          ],
        },
      ],
    });
  },

  // ─── UNIFIED ENTRY POINT ───────────────────────────────────────────────────

  /**
   * Điểm vào thống nhất để tạo AP Invoice — xử lý cả manual và ai_ocr.
   *
   * Luồng:
   *  1. Validation (supplier, branch, invoice_no, lines)
   *  2. Duplicate Detection
   *  3. Create AP Invoice + Lines (atomic transaction)
   *  4. Three-Way Matching (async, nếu có po_id)
   *  5. Audit Trail Logging
   *  6. Return invoice đầy đủ
   *
   * Ví dụ thực tế:
   *  - OCR scan hóa đơn Công ty ABC → source='ai_ocr', invoice_document_id=42
   *  - Kế toán tạo thủ công hóa đơn dịch vụ điện → source='manual', po_id=null
   */
  async createAPInvoice(
    input: CreateAPInvoiceInput,
    user: any,
  ): Promise<CreateAPInvoiceResult> {
    // ── 1. Validation ──────────────────────────────────────────────────────
    if (!input.supplier_id) {
      throw { status: 400, message: "supplier_id là bắt buộc" };
    }
    if (!input.invoice_no?.trim()) {
      throw { status: 400, message: "invoice_no là bắt buộc" };
    }
    if (!input.lines || input.lines.length === 0) {
      throw { status: 400, message: "Hóa đơn phải có ít nhất một dòng hàng" };
    }
    for (const line of input.lines) {
      if (line.unit_price == null || line.unit_price < 0) {
        throw { status: 400, message: "unit_price của dòng hàng không hợp lệ" };
      }
      if (line.quantity == null || line.quantity <= 0) {
        throw { status: 400, message: "quantity của dòng hàng phải > 0" };
      }
    }
    if (input.source === "ai_ocr" && !input.invoice_document_id) {
      throw {
        status: 400,
        message: "invoice_document_id là bắt buộc khi source = ai_ocr",
      };
    }

    // ── 2. Duplicate Detection ─────────────────────────────────────────────
    let duplicateWarning: CreateAPInvoiceResult["duplicateWarning"] | undefined;

    const dupDetector = new DuplicateDetectorService();
    const dupResult = await dupDetector.check(
      input.invoice_no,
      input.supplier_id,
      input.branch_id,
    );

    if (dupResult.isDuplicate && !input.overrideDuplicate) {
      // Trả về cảnh báo — caller quyết định có tiếp tục không
      throw {
        status: 409,
        message: "Hóa đơn đã tồn tại trong hệ thống",
        duplicate: {
          existingInvoiceId: dupResult.existingInvoiceId,
          existingInvoiceDate: dupResult.existingInvoiceDate,
          message: dupResult.message,
        },
      };
    }

    if (dupResult.isDuplicate && input.overrideDuplicate) {
      duplicateWarning = {
        existingInvoiceId: dupResult.existingInvoiceId!,
        ...(dupResult.existingInvoiceDate && {
          existingInvoiceDate: dupResult.existingInvoiceDate,
        }),
        message: dupResult.message ?? "Ghi đè hóa đơn trùng lặp",
      };
    }

    // ── 3. Create AP Invoice + Lines (atomic transaction) ──────────────────
    let newInvoiceId!: number;

    // Auto-calculate due_date from payment_term_id if not provided
    let resolvedDueDate = input.due_date;
    if (!resolvedDueDate && (input as any).payment_term_id) {
      resolvedDueDate = await this.calculateDueDate(
        input.invoice_date,
        (input as any).payment_term_id,
      );
    }

    await sequelize.transaction(async (t: Transaction) => {
      const invoice = await ApInvoice.create(
        {
          source: input.source,
          invoice_no: input.invoice_no,
          invoice_date: input.invoice_date,
          ...(resolvedDueDate && { due_date: resolvedDueDate }),
          supplier_id: input.supplier_id,
          ...(input.po_id && { po_id: input.po_id }),
          branch_id: input.branch_id,
          created_by: input.created_by,
          approval_status: "draft",
          status: "draft",
          paid_amount: 0,
          payment_term_id: (input as any).payment_term_id ?? null,
          currency_id: (input as any).currency_id ?? null,
          exchange_rate: (input as any).exchange_rate ?? 1.0,
          invoice_document_id: input.invoice_document_id ?? null,
          ocr_confidence: input.ocr_confidence ?? null,
          invoice_series: input.invoice_series ?? null,
          invoice_template: input.invoice_template ?? null,
          tax_code: input.tax_code ?? null,
          total_before_tax: input.total_before_tax ?? 0,
          total_tax: input.total_tax ?? 0,
          total_after_tax: input.total_after_tax ?? 0,
          matching_status: "pending",
        },
        { transaction: t },
      );

      newInvoiceId = invoice.id;

      for (const line of input.lines) {
        const qty = line.quantity;
        const price = line.unit_price;
        const lineTotal = line.line_total ?? qty * price;

        await ApInvoiceLine.create(
          {
            ap_invoice_id: invoice.id,
            ...(line.product_id && { product_id: line.product_id }),
            description: line.description ?? "",
            quantity: qty,
            unit_price: price,
            uom_id: line.uom_id ?? null,
            ...(line.tax_rate_id && { tax_rate_id: line.tax_rate_id }),
            line_total: lineTotal,
            line_tax: line.line_tax ?? 0,
            line_total_after_tax: line.line_total_after_tax ?? lineTotal,
            po_line_id: line.po_line_id ?? null,
            grn_line_id: line.grn_line_id ?? null,
          },
          { transaction: t },
        );
      }
    });

    // ── 4. Three-Way Matching (async, không block response) ────────────────
    let matchingResult: CreateAPInvoiceResult["matchingResult"] | undefined;

    if (input.po_id) {
      const matcher = new ThreeWayMatcherService();
      matcher
        .match(newInvoiceId)
        .then((result) => {
          matchingResult = {
            overall_status: result.overall_status,
            summary: result.summary,
          };
          // Log mismatch nếu có
          if (result.overall_status === "mismatch") {
            apInvoiceAuditLogService.logMismatch({
              ap_invoice_id: newInvoiceId,
              created_by: input.created_by,
              matching_status: result.overall_status,
              matching_details: {
                summary: result.summary,
                line_results: result.line_results,
              },
            });
          }
        })
        .catch((err) => {
          logger.error(
            `Three-way matching failed for invoice ${newInvoiceId}: ${err.message}`,
          );
        });
    }

    // ── 5. Audit Trail ─────────────────────────────────────────────────────
    await apInvoiceAuditLogService.logCreation({
      ap_invoice_id: newInvoiceId,
      source: input.source,
      created_by: input.created_by,
      ocr_confidence: input.ocr_confidence ?? null,
      matching_status: input.po_id ? "pending" : null,
    });

    // Ghi log ghi đè trùng lặp nếu có
    if (duplicateWarning && input.overrideDuplicate) {
      await apInvoiceAuditLogService.logOverride({
        ap_invoice_id: newInvoiceId,
        created_by: input.created_by,
        override_type: "duplicate",
        override_reason: input.override_reason ?? "Người dùng xác nhận ghi đè",
      });
    }

    // ── 6. Return ──────────────────────────────────────────────────────────
    const createdInvoice = await this.getById(newInvoiceId, user);

    return {
      invoice: createdInvoice!,
      ...(duplicateWarning && { duplicateWarning }),
      ...(matchingResult && { matchingResult }),
    };
  },

  // ─── LEGACY — backward compatible ─────────────────────────────────────────

  /**
   * Tạo AP Invoice từ PO — giữ nguyên để không break code cũ.
   * Nội bộ gọi createAPInvoice() với source='manual'.
   *
   * Ví dụ: Kế toán nhấn "Tạo hóa đơn" từ màn hình chi tiết PO-2024-001
   */
  async createFromPO(poId: number, user: any) {
    if (![Role.ACCOUNT, Role.CHACC, "ADMIN", "CEO"].includes(user.role)) {
      throw {
        status: 403,
        message: "You do not have permission to create AP Invoice",
      };
    }

    const po = await PurchaseOrder.findByPk(poId, {
      include: [{ model: PurchaseOrderLine, as: "lines" }],
    });
    if (!po) throw { status: 404, message: "Purchase Order not found" };

    if (po.branch_id !== user.branch_id) {
      throw {
        status: 403,
        message: "You cannot create invoice for another branch",
      };
    }

    if (
      po.status !== "confirmed" &&
      po.status !== "partially_received" &&
      po.status !== "completed"
    ) {
      throw {
        status: 400,
        message:
          "Only CONFIRMED, PARTIALLY_RECEIVED or COMPLETED Purchase Orders can create AP Invoice",
      };
    }

    const poLines = (po as any).lines ?? [];
    if (!poLines.length) {
      throw { status: 400, message: "Purchase Order has no line items" };
    }

    // ── Validate: total invoiced amount must not exceed PO total ──────────
    const existingInvoices = await ApInvoice.findAll({
      where: {
        po_id: po.id,
        status: { [Op.notIn]: ["cancelled"] },
      },
    });

    const totalInvoiced = existingInvoices.reduce(
      (sum, inv) => sum + Number(inv.total_after_tax ?? 0),
      0,
    );
    const poTotal = Number(po.total_after_tax ?? 0);

    if (totalInvoiced >= poTotal) {
      throw {
        status: 400,
        message: `This Purchase Order has been fully invoiced (${totalInvoiced.toLocaleString()} / ${poTotal.toLocaleString()} VND). No remaining amount to invoice.`,
      };
    }

    // ── Validate per-line: remaining qty per po_line ──────────────────────
    const existingInvoiceLines = await ApInvoiceLine.findAll({
      include: [
        {
          model: ApInvoice,
          as: "invoice",
          where: {
            po_id: po.id,
            status: { [Op.notIn]: ["cancelled"] },
          },
          required: true,
        },
      ],
    });

    const invoicedQtyByPoLine: Record<number, number> = {};
    for (const invLine of existingInvoiceLines) {
      if (invLine.po_line_id) {
        invoicedQtyByPoLine[invLine.po_line_id] =
          (invoicedQtyByPoLine[invLine.po_line_id] ?? 0) +
          Number(invLine.quantity ?? 0);
      }
    }

    // 1. Calculate each line's initial values (before header discount)
    const calculatedLines = [];
    let totalBeforeHeaderDiscount = 0;

    for (const line of poLines) {
      const invoicedQty = invoicedQtyByPoLine[line.id] ?? 0;
      const remainingQty = Number(line.quantity ?? 0) - invoicedQty;
      if (remainingQty <= 0) continue; // skip fully invoiced lines

      const unitPrice = Number(line.unit_price ?? 0);
      const gross = remainingQty * unitPrice;
      const discountPercent = Number(line.discount_percent ?? 0);
      const discountAmount = gross * (discountPercent / 100);
      const lineTotalBeforeHeader = gross - discountAmount;

      totalBeforeHeaderDiscount += lineTotalBeforeHeader;

      calculatedLines.push({
        line,
        remainingQty,
        unitPrice,
        discountPercent,
        discountAmount,
        lineTotalBeforeHeader,
      });
    }

    if (calculatedLines.length === 0) {
      throw {
        status: 400,
        message: "All lines in this Purchase Order have already been invoiced.",
      };
    }

    // 2. Determine Header Discount Amount
    let headerDiscountAmount = 0;
    let headerDiscountPercent = 0;

    if (po.discount_percent && Number(po.discount_percent) > 0) {
      headerDiscountPercent = Number(po.discount_percent);
      headerDiscountAmount = totalBeforeHeaderDiscount * (headerDiscountPercent / 100);
    } else if (po.discount_amount && Number(po.discount_amount) > 0) {
      const poTotalBeforeHeaderDiscount = Number(po.total_before_tax ?? 0) + Number(po.discount_amount ?? 0);
      const ratio = poTotalBeforeHeaderDiscount > 0 ? (totalBeforeHeaderDiscount / poTotalBeforeHeaderDiscount) : 0;
      headerDiscountAmount = Number(po.discount_amount) * ratio;
      headerDiscountPercent = totalBeforeHeaderDiscount > 0 ? (headerDiscountAmount / totalBeforeHeaderDiscount) * 100 : 0;
    }

    // 3. Pro-rata distribution of header discount to lines
    const lines: CreateAPInvoiceLineInput[] = [];
    for (const item of calculatedLines) {
      const line = item.line;
      const weight = totalBeforeHeaderDiscount > 0 ? (item.lineTotalBeforeHeader / totalBeforeHeaderDiscount) : 0;
      const distributedDiscount = headerDiscountAmount * weight;

      const netLineTotal = item.lineTotalBeforeHeader - distributedDiscount;
      const taxRate = line.tax_rate_id
        ? await TaxRate.findByPk(line.tax_rate_id)
        : null;
      const taxRateValue = taxRate ? Number((taxRate as any).rate ?? 0) : 0;
      const netLineTax = (netLineTotal * taxRateValue) / 100;
      const netLineTotalAfterTax = netLineTotal + netLineTax;

      lines.push({
        product_id: line.product_id ?? null,
        description: line.description ?? po.description ?? "",
        quantity: item.remainingQty,
        unit_price: item.unitPrice,
        uom_id: line.uom_id ?? null,
        tax_rate_id: line.tax_rate_id ?? null,
        line_total: netLineTotal,
        line_tax: netLineTax,
        line_total_after_tax: netLineTotalAfterTax,
        po_line_id: line.id,
      });
    }

    const totalBeforeTax = totalBeforeHeaderDiscount - headerDiscountAmount;
    const totalTax = lines.reduce((s, l) => s + (l.line_tax ?? 0), 0);
    const totalAfterTax = totalBeforeTax + totalTax;

    const invoiceNo = `AP-${new Date().getFullYear()}-${Date.now()}`;
    const invoiceDate = new Date();

    const result = await this.createAPInvoice(
      {
        source: "manual",
        invoice_no: invoiceNo,
        invoice_date: invoiceDate,
        // Không truyền due_date → createAPInvoice() tự tính từ payment_term_id
        supplier_id: po.supplier_id!,
        ...(po.id && { po_id: po.id }),
        branch_id: po.branch_id!,
        created_by: user.id,
        ...(po.payment_term_id && { payment_term_id: po.payment_term_id }),
        ...(po.currency_id && { currency_id: po.currency_id }),
        exchange_rate: (po as any).exchange_rate ?? 1.0,
        ...(totalBeforeTax > 0 && { total_before_tax: totalBeforeTax }),
        ...(totalTax > 0 && { total_tax: totalTax }),
        ...(totalAfterTax > 0 && { total_after_tax: totalAfterTax }),
        lines,
      } as any,
      user,
    );

    return result.invoice;
  },

  // ─── PARTIAL INVOICE FROM PO ───────────────────────────────────────────────

  /**
   * Tạo partial AP Invoice từ PO — user chọn từng line và nhập qty muốn invoice.
   *
   * Body: { lines: [{ po_line_id, quantity }] }
   *
   * Ví dụ: PO có 2 lines (Lavie 100 thùng + iPhone 10 hộp),
   * user chỉ invoice 60 thùng Lavie trước → giao hàng đợt 1.
   */
  async createPartialFromPO(
    poId: number,
    selectedLines: Array<{ po_line_id: number; quantity: number }>,
    user: any,
    metadata?: {
      invoice_no?: string;
      invoice_date?: string;
      due_date?: string;
      invoice_series?: string;
      invoice_template?: string;
      tax_code?: string;
    },
  ) {
    if (![Role.ACCOUNT, Role.CHACC, "ADMIN", "CEO"].includes(user.role)) {
      throw {
        status: 403,
        message: "You do not have permission to create AP Invoice",
      };
    }
    if (!selectedLines || selectedLines.length === 0) {
      throw { status: 400, message: "At least one line must be selected" };
    }

    const po = await PurchaseOrder.findByPk(poId, {
      include: [{ model: PurchaseOrderLine, as: "lines" }],
    });
    if (!po) throw { status: 404, message: "Purchase Order not found" };
    if (po.branch_id !== user.branch_id) {
      throw {
        status: 403,
        message: "You cannot create invoice for another branch",
      };
    }
    if (!["confirmed", "partially_received", "completed"].includes(po.status)) {
      throw {
        status: 400,
        message:
          "Only CONFIRMED, PARTIALLY_RECEIVED or COMPLETED POs can create AP Invoice",
      };
    }

    const poLines: PurchaseOrderLine[] = (po as any).lines ?? [];
    const poLineMap = new Map(poLines.map((l) => [l.id, l]));

    // Get already-invoiced qty per po_line
    const existingInvoiceLines = await ApInvoiceLine.findAll({
      include: [
        {
          model: ApInvoice,
          as: "invoice",
          where: { po_id: po.id, status: { [Op.notIn]: ["cancelled"] } },
          required: true,
        },
      ],
    });
    const invoicedQtyByPoLine: Record<number, number> = {};
    for (const invLine of existingInvoiceLines) {
      if (invLine.po_line_id) {
        invoicedQtyByPoLine[invLine.po_line_id] =
          (invoicedQtyByPoLine[invLine.po_line_id] ?? 0) +
          Number(invLine.quantity ?? 0);
      }
    }

    // Validate each selected line
    const calculatedLines = [];
    let totalBeforeHeaderDiscount = 0;

    for (const sel of selectedLines) {
      const poLine = poLineMap.get(sel.po_line_id);
      if (!poLine) {
        throw { status: 400, message: `PO line ${sel.po_line_id} not found` };
      }
      if (sel.quantity <= 0) {
        throw {
          status: 400,
          message: `Quantity must be > 0 for line ${sel.po_line_id}`,
        };
      }

      const totalQty = Number(poLine.quantity ?? 0);
      const alreadyInvoiced = invoicedQtyByPoLine[poLine.id] ?? 0;
      const remainingQty = totalQty - alreadyInvoiced;

      if (sel.quantity > remainingQty) {
        throw {
          status: 400,
          message: `Line ${sel.po_line_id}: requested qty ${sel.quantity} exceeds remaining qty ${remainingQty}`,
        };
      }

      const unitPrice = Number(poLine.unit_price ?? 0);
      const gross = sel.quantity * unitPrice;
      const discountPercent = Number(poLine.discount_percent ?? 0);
      const discountAmount = gross * (discountPercent / 100);
      const lineTotalBeforeHeader = gross - discountAmount;

      totalBeforeHeaderDiscount += lineTotalBeforeHeader;

      calculatedLines.push({
        poLine,
        quantity: sel.quantity,
        unitPrice,
        discountPercent,
        discountAmount,
        lineTotalBeforeHeader,
      });
    }

    // 2. Determine Header Discount Amount
    let headerDiscountAmount = 0;
    let headerDiscountPercent = 0;

    if (po.discount_percent && Number(po.discount_percent) > 0) {
      headerDiscountPercent = Number(po.discount_percent);
      headerDiscountAmount = totalBeforeHeaderDiscount * (headerDiscountPercent / 100);
    } else if (po.discount_amount && Number(po.discount_amount) > 0) {
      const poTotalBeforeHeaderDiscount = Number(po.total_before_tax ?? 0) + Number(po.discount_amount ?? 0);
      const ratio = poTotalBeforeHeaderDiscount > 0 ? (totalBeforeHeaderDiscount / poTotalBeforeHeaderDiscount) : 0;
      headerDiscountAmount = Number(po.discount_amount) * ratio;
      headerDiscountPercent = totalBeforeHeaderDiscount > 0 ? (headerDiscountAmount / totalBeforeHeaderDiscount) * 100 : 0;
    }

    // 3. Pro-rata distribution of header discount to lines
    const lines: CreateAPInvoiceLineInput[] = [];
    for (const item of calculatedLines) {
      const poLine = item.poLine;
      const weight = totalBeforeHeaderDiscount > 0 ? (item.lineTotalBeforeHeader / totalBeforeHeaderDiscount) : 0;
      const distributedDiscount = headerDiscountAmount * weight;

      const netLineTotal = item.lineTotalBeforeHeader - distributedDiscount;
      const taxRate = poLine.tax_rate_id
        ? await TaxRate.findByPk(poLine.tax_rate_id)
        : null;
      const taxRateValue = taxRate ? Number((taxRate as any).rate ?? 0) : 0;
      const netLineTax = (netLineTotal * taxRateValue) / 100;
      const netLineTotalAfterTax = netLineTotal + netLineTax;

      lines.push({
        product_id: poLine.product_id ?? null,
        description: poLine.description ?? po.description ?? "",
        quantity: item.quantity,
        unit_price: item.unitPrice,
        uom_id: poLine.uom_id ?? null,
        tax_rate_id: poLine.tax_rate_id ?? null,
        line_total: netLineTotal,
        line_tax: netLineTax,
        line_total_after_tax: netLineTotalAfterTax,
        po_line_id: poLine.id,
      });
    }

    const totalBeforeTax = totalBeforeHeaderDiscount - headerDiscountAmount;
    const totalTax = lines.reduce((s, l) => s + (l.line_tax ?? 0), 0);
    const totalAfterTax = totalBeforeTax + totalTax;

    // ── Dùng metadata từ user nếu có, fallback về auto-generate ──────────
    const invoiceNo =
      metadata?.invoice_no?.trim() ||
      `AP-${new Date().getFullYear()}-${Date.now()}`;

    const parseDate = (raw?: string): Date => {
      if (!raw) return new Date();
      const d = new Date(raw);
      return isNaN(d.getTime()) ? new Date() : d;
    };

    const invoiceDate = parseDate(metadata?.invoice_date);
    // Nếu user cung cấp due_date thì dùng, ngược lại để createAPInvoice() tính từ payment_term_id
    const explicitDueDate = metadata?.due_date
      ? parseDate(metadata.due_date)
      : undefined;

    const result = await this.createAPInvoice(
      {
        source: "manual",
        invoice_no: invoiceNo,
        invoice_date: invoiceDate,
        ...(explicitDueDate && { due_date: explicitDueDate }),
        supplier_id: po.supplier_id!,
        ...(po.id && { po_id: po.id }),
        branch_id: po.branch_id!,
        created_by: user.id,
        ...(po.payment_term_id && { payment_term_id: po.payment_term_id }),
        ...(po.currency_id && { currency_id: po.currency_id }),
        exchange_rate: (po as any).exchange_rate ?? 1.0,
        invoice_series: metadata?.invoice_series ?? null,
        invoice_template: metadata?.invoice_template ?? null,
        tax_code: metadata?.tax_code ?? null,
        ...(totalBeforeTax > 0 && { total_before_tax: totalBeforeTax }),
        ...(totalTax > 0 && { total_tax: totalTax }),
        ...(totalAfterTax > 0 && { total_after_tax: totalAfterTax }),
        lines,
      } as any,
      user,
    );

    return result.invoice;
  },

  // ─── APPROVAL WORKFLOW ─────────────────────────────────────────────────────

  async submitForApproval(id: number, user: any, app?: any) {
    const apInvoice = await this.getById(id, user);
    if (!apInvoice) throw new Error("ApInvoice order not found");

    if (apInvoice.branch_id !== user.branch_id) {
      throw new Error("You cannot submit a invoice for another branch.");
    }

    if (apInvoice.status !== "draft") {
      throw new Error("Only draft invoice can be submitted.");
    }
    if (apInvoice.created_by !== user.id) {
      throw new Error("Only the creator can submit");
    }

    apInvoice.approval_status = "waiting_approval";
    apInvoice.submitted_at = new Date();
    await apInvoice.save();

    if (app) {
      const io = app.get("io");
      await notificationService.createNotification({
        type: "SUBMIT",
        referenceType: "AP_INVOICE",
        referenceId: apInvoice.id!,
        referenceNo: apInvoice.invoice_no!,
        branchId: apInvoice.branch_id!,
        submitterId: user.id,
        submitterName: user.fullName || user.username,
        io,
      });
    }

    return this.getById(apInvoice.id, user);
  },

  async approve(id: number, user: any) {
    if (user.role !== Role.CHACC && user.role !== "ADMIN" && user.role !== "CEO")
      throw new Error("Only Chief Accountant can approve");

    const t: Transaction = await sequelize.transaction();
    try {
      const invoice = await ApInvoice.findByPk(id, {
        include: [
          { model: PurchaseOrder, as: "order" },
          { model: ApInvoiceLine, as: "lines" },
        ],
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!invoice) throw new Error("AP Invoice not found");
      if (invoice.branch_id !== user.branch_id)
        throw new Error("Cross-branch denied");
      if (invoice.approval_status !== "waiting_approval")
        throw new Error("Invoice is not waiting for approval");

      if (invoice.matching_status === "mismatch") {
        throw {
          status: 422,
          code: "MISMATCH_REQUIRES_OVERRIDE",
          message: "Hóa đơn có kết quả 3-Way Matching không khớp. Cần ghi đè mismatch trước khi duyệt.",
          invoice_id: id,
        };
      }

      await invoice.update(
        {
          approval_status: "approved",
          status: "posted",
          approved_by: user.id,
          approved_at: new Date(),
          reject_reason: null,
        },
        { transaction: t },
      );

      // Kiểm tra kỳ kế toán đã khóa sổ hay chưa
      await checkPeriodLocked(invoice.invoice_date ?? new Date(), t);

      const journal = await GlJournal.findOne({
        where: { code: "PURCHASE" },
        transaction: t,
      });
      if (!journal) throw new Error("PURCHASE journal not found");

      const entry = await GlEntry.create(
        {
          journal_id: journal.id,
          entry_no: `GL-AP-${invoice.id}`,
          entry_date: invoice.invoice_date ?? new Date(),
          reference_type: "ap_invoice",
          reference_id: invoice.id,
          memo: `Ghi nhận công nợ phải trả ${invoice.invoice_no}`,
          status: "posted",
          branch_id: invoice.branch_id ?? null,
        } as any,
        { transaction: t },
      );

      // Lấy các tài khoản 156, 1331, 331 qua mapping động
      const [INVENTORY_ACC_ID, VAT_INPUT_ACC_ID, AP_ACC_ID] = await Promise.all([
        getMappedAccount(invoice.branch_id, "AP_EXPENSE_INVENTORY", "156", t),
        getMappedAccount(invoice.branch_id, "AP_VAT", "1331", t),
        getMappedAccount(invoice.branch_id, "AP_PAYABLE", "331", t),
      ]);

      const totalBeforeTax = Number(invoice.total_before_tax || 0);
      const totalTax = Number(invoice.total_tax || 0);
      const totalAfterTax = Number(invoice.total_after_tax || 0);

      // Lấy supplier_id từ invoice trực tiếp (hỗ trợ cả invoice không có PO)
      const supplierId =
        invoice.supplier_id ?? (invoice as any).order?.supplier_id ?? null;

      const lines: any[] = [];

      if (totalBeforeTax !== 0) {
        lines.push({
          entry_id: entry.id,
          account_id: INVENTORY_ACC_ID,
          partner_id: supplierId,
          debit: totalBeforeTax,
          credit: 0,
        });
      }

      if (totalTax !== 0) {
        lines.push({
          entry_id: entry.id,
          account_id: VAT_INPUT_ACC_ID,
          partner_id: supplierId,
          debit: totalTax,
          credit: 0,
        });
      }

      lines.push({
        entry_id: entry.id,
        account_id: AP_ACC_ID,
        partner_id: supplierId,
        debit: 0,
        credit: totalAfterTax,
      });

      await GlEntryLine.bulkCreate(lines, { transaction: t });
      await t.commit();

      return this.getById(invoice.id, user);
    } catch (e) {
      await t.rollback();
      throw e;
    }
  },

  async reject(id: number, reason: string, user: any, app?: any) {
    if (user.role !== Role.CHACC && user.role !== "ADMIN" && user.role !== "CEO") {
      throw new Error("Only Chief Accountant can reject");
    }
 
    const invoice = await ApInvoice.findByPk(id);
    if (!invoice) throw new Error("AP Invoice not found");
 
    const companyBranchIds = await getCompanyBranchIds(user);
    if (user.role !== "ADMIN" && user.role !== "CEO" && invoice.branch_id !== user.branch_id) {
      throw new Error("You cannot reject invoice from another branch");
    }
    if (!companyBranchIds.includes(invoice.branch_id)) {
      throw new Error("You cannot reject invoice for a different company");
    }
    if (invoice.approval_status !== "waiting_approval") {
      throw new Error("Invoice is not waiting for approval");
    }

    invoice.approval_status = "rejected";
    invoice.status = "cancelled";
    invoice.approved_by = user.id;
    invoice.approved_at = new Date();
    invoice.reject_reason = reason;
    await invoice.save();

    if (app && invoice.created_by) {
      const io = app.get("io");
      await notificationService.createNotification({
        type: "REJECT",
        referenceType: "AP_INVOICE",
        referenceId: invoice.id!,
        referenceNo: invoice.invoice_no!,
        branchId: invoice.branch_id!,
        submitterId: invoice.created_by,
        approverName: user.fullName || user.username,
        rejectReason: reason,
        io,
      });
    }

    return this.getById(invoice.id, user);
  },

  // ─── DELETE ────────────────────────────────────────────────────────────────

  /**
   * Xóa AP Invoice — chỉ cho phép khi status = draft và approval_status = draft
   * (chưa submit for approval).
   */
  async deleteInvoice(id: number, user: any) {
    const invoice = await ApInvoice.findByPk(id);
    if (!invoice) throw { status: 404, message: "AP Invoice not found" };

    if (invoice.branch_id !== user.branch_id) {
      throw {
        status: 403,
        message: "You cannot delete an invoice from another branch",
      };
    }
    if (invoice.created_by !== user.id) {
      throw {
        status: 403,
        message: "Only the creator can delete this invoice",
      };
    }
    if (invoice.status !== "draft" || invoice.approval_status !== "draft") {
      throw {
        status: 400,
        message:
          "Only draft invoices that have not been submitted can be deleted",
      };
    }

    // Delete lines first (cascade safety)
    await ApInvoiceLine.destroy({ where: { ap_invoice_id: id } });
    await invoice.destroy();
  },

  // ─── REPORTS ───────────────────────────────────────────────────────────────

  async getPostedSummaryBySupplier(supplierId: number, user: any) {
    const invoices: any[] = await sequelize.query(
      `
      SELECT
        ai.id,
        ai.invoice_no,
        ai.invoice_date,
        ai.total_after_tax,
        ai.status,
        ai.po_id,
        ai.total_after_tax - COALESCE(SUM(apa.applied_amount), 0)
          AS outstanding_amount,
        po.po_no,
        p.id   AS supplier_id,
        p.name AS supplier_name
      FROM ap_invoices ai
      LEFT JOIN purchase_orders po ON po.id = ai.po_id
      JOIN partners p ON p.id = ai.supplier_id
      LEFT JOIN ap_payment_allocations apa ON apa.ap_invoice_id = ai.id
      WHERE ai.branch_id = :branchId
        AND ai.status IN ('posted', 'partially_paid')
        AND ai.approval_status = 'approved'
        AND ai.supplier_id = :supplierId
      GROUP BY ai.id, po.id, p.id
      HAVING (ai.total_after_tax - COALESCE(SUM(apa.applied_amount), 0)) > 0
      ORDER BY ai.invoice_date ASC
      `,
      {
        replacements: { branchId: user.branch_id, supplierId },
        type: "SELECT",
      },
    );

    const totalAmount = invoices.reduce(
      (sum, inv) => sum + Number(inv.outstanding_amount),
      0,
    );

    return { invoices, total_amount: totalAmount };
  },

  async getPostedSuppliers(user: any) {
    const invoices = await ApInvoice.findAll({
      where: {
        branch_id: user.branch_id,
        status: ["posted", "partially_paid"],
        approval_status: "approved",
      },
      include: [
        {
          model: Partner,
          as: "invoiceSupplier",
          required: false,
        },
        {
          model: PurchaseOrder,
          as: "order",
          required: false,
          include: [{ model: Partner, as: "supplier" }],
        },
      ],
    });

    const map = new Map<number, any>();

    invoices.forEach((inv: any) => {
      // Ưu tiên supplier_id trực tiếp trên invoice
      const supplier = inv.invoiceSupplier ?? inv.order?.supplier;
      if (supplier && !map.has(supplier.id)) {
        map.set(supplier.id, supplier);
      }
    });

    return Array.from(map.values());
  },

  // ─── ENHANCED FILTERS ──────────────────────────────────────────────────────

  /**
   * getAll với filter mở rộng:
   *   ?due_soon=7          — due_date trong N ngày tới, status != paid
   *   ?overdue=true        — due_date < today AND status NOT IN (paid, cancelled)
   *   ?paid_status=...     — filter theo status (partially_paid | paid | posted)
   *   ?supplier_id=...     — filter theo NCC
   *   ?date_from / date_to — filter theo invoice_date
   */
  async getAllWithFilters(query: any, user: any) {
    const companyBranchIds = await getCompanyBranchIds(user);
    const where: any = {};
    if (user.role === "ADMIN" || user.role === "CEO") {
      where.branch_id = { [Op.in]: companyBranchIds };
    } else {
      where.branch_id = user.branch_id;
    }
 
    if (user.role === "ACCOUNT") where.created_by = user.id;

    // Existing filters
    if (query.status) where.status = query.status;
    if (query.approval_status) where.approval_status = query.approval_status;
    if (query.source) where.source = query.source;
    if (query.supplier_id) where.supplier_id = Number(query.supplier_id);

    // Filter by supplierName if provided
    if (query.supplierName) {
      where["$invoiceSupplier.name$"] = {
        [Op.like]: `%${query.supplierName}%`,
      };
    }

    // Date range on invoice_date
    if (query.date_from || query.date_to) {
      where.invoice_date = {};
      if (query.date_from)
        where.invoice_date[Op.gte] = new Date(query.date_from);
      if (query.date_to) where.invoice_date[Op.lte] = new Date(query.date_to);
    }

    // due_soon: due_date trong N ngày tới, chưa paid
    if (query.due_soon) {
      const days = parseInt(String(query.due_soon), 10) || 7;
      const today = new Date();
      const future = new Date();
      future.setDate(future.getDate() + days);
      where.due_date = { [Op.between]: [today, future] };
      where.status = { [Op.notIn]: ["paid", "cancelled"] };
    }

    // overdue: due_date < today, chưa paid
    if (query.overdue === "true") {
      where.due_date = { [Op.lt]: new Date() };
      where.status = { [Op.notIn]: ["paid", "cancelled"] };
    }

    // paid_status alias
    if (query.paid_status) where.status = query.paid_status;

    return ApInvoice.findAll({
      where,
      include: [
        { model: Branch, as: "branch" },
        {
          model: User,
          as: "creator",
          attributes: ["id", "full_name", "email", "phone", "avatar_url"],
        },
        {
          model: User,
          as: "approver",
          attributes: ["id", "full_name", "email", "phone", "avatar_url"],
        },
        {
          model: Partner,
          as: "invoiceSupplier",
          attributes: ["id", "name", "email", "phone"],
        },
      ],
      order: [
        ["due_date", "ASC"],
        ["created_at", "DESC"],
      ],
    });
  },

  // ─── PAYMENT HISTORY ───────────────────────────────────────────────────────

  /**
   * Lấy lịch sử thanh toán của 1 AP Invoice.
   * Trả về danh sách ap_payment_allocations kèm thông tin payment.
   */
  async getPaymentHistory(invoiceId: number, user: any) {
    const invoice = await ApInvoice.findOne({
      where: { id: invoiceId, branch_id: user.branch_id },
    });
    if (!invoice) throw { status: 404, message: "AP Invoice not found" };

    const rows: any[] = await sequelize.query(
      `SELECT
         apa.id            AS allocation_id,
         apa.applied_amount,
         apa.allocation_date,
         apa.notes         AS allocation_notes,
         ap.id             AS payment_id,
         ap.payment_no,
         ap.payment_date,
         ap.method,
         ap.amount         AS payment_amount,
         ap.transaction_reference,
         u.id              AS created_by_id,
         u.full_name       AS created_by_name
       FROM ap_payment_allocations apa
       JOIN ap_payments ap ON ap.id = apa.payment_id
       LEFT JOIN users u ON u.id = apa.created_by
       WHERE apa.ap_invoice_id = :invoiceId
       ORDER BY apa.created_at ASC`,
      {
        replacements: { invoiceId },
        type: "SELECT",
      },
    );

    const totalPaid = rows.reduce((s, r) => s + Number(r.applied_amount), 0);
    const remaining = Math.max(
      0,
      Number(invoice.total_after_tax ?? 0) - totalPaid,
    );

    return {
      invoice_id: invoiceId,
      invoice_no: invoice.invoice_no,
      total_after_tax: Number(invoice.total_after_tax ?? 0),
      paid_amount: Number(invoice.paid_amount ?? 0),
      remaining_amount: remaining,
      status: invoice.status,
      due_date: invoice.due_date,
      last_payment_date: invoice.last_payment_date,
      allocations: rows,
    };
  },

  // ─── DUE DATE CALCULATION ──────────────────────────────────────────────────

  /**
   * Tính due_date từ invoice_date + payment_term.days.
   * Dùng khi tạo AP Invoice với payment_term_id.
   */
  async calculateDueDate(
    invoiceDate: Date,
    paymentTermId: number,
  ): Promise<Date> {
    const { PaymentTerm } =
      await import("../../master-data/models/paymentTerm.model").catch(() => ({
        PaymentTerm: null,
      }));

    if (!PaymentTerm) {
      // Fallback: Net 30
      const d = new Date(invoiceDate);
      d.setDate(d.getDate() + 30);
      return d;
    }

    const term = await (PaymentTerm as any).findByPk(paymentTermId);
    const days = term ? Number(term.days ?? 30) : 30;
    const d = new Date(invoiceDate);
    d.setDate(d.getDate() + days);
    return d;
  },

  async overrideMismatch(id: number, user: any, reason: string) {
    if (user.role !== Role.CHACC && user.role !== "ADMIN" && user.role !== "CEO") {
      throw { status: 403, message: "Chỉ Kế toán trưởng mới được ghi đè mismatch" };
    }
    const invoice = await ApInvoice.findByPk(id);
    if (!invoice) throw { status: 404, message: "Không tìm thấy hóa đơn" };
    if (invoice.matching_status !== "mismatch") {
      throw { status: 400, message: "Hóa đơn không ở trạng thái mismatch" };
    }
    if (!reason?.trim()) {
      throw { status: 400, message: "override_reason là bắt buộc" };
    }

    // Chuyển matching_status → "matched"
    await invoice.update({ matching_status: "matched" });

    // Ghi audit log
    await apInvoiceAuditLogService.logOverride({
      ap_invoice_id: id,
      created_by: user.id,
      override_type: "mismatch",
      override_reason: reason,
    });

    return this.getById(id, user);
  },
};
