import { Role } from "../../../core/types/enum";
import { ApInvoiceLine, Partner, Product, sequelize } from "../../../models";
import { User } from "../../auth/models/user.model";
import { Branch } from "../../company/models/branch.model";
import { ApInvoice } from "../models/apInvoice.model";
import { PurchaseOrder } from "../models/purchaseOrder.model";
import { PurchaseOrderLine } from "../models/purchaseOrderLine.model";
import { Transaction } from "sequelize";
import { GlJournal } from "../../finance/models/glJournal.model";
import { GlEntry } from "../../finance/models/glEntry.model";
import { GlEntryLine } from "../../finance/models/glEntryLine.model";
import { notificationService } from "../../../core/services/notification.service";
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
    const { status, approval_status, source } = query;

    const where: any = { branch_id: user.branch_id };

    if (user.role === "ACCOUNT") {
      where.created_by = user.id;
    }

    if (status) where.status = status;
    if (approval_status) where.approval_status = approval_status;
    // Lọc theo nguồn gốc tạo: manual | ai_ocr
    if (source) where.source = source;

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
      ],
      order: [["created_at", "DESC"]],
    });
  },

  async getById(id: number, user: any) {
    const where: any = { id, branch_id: user.branch_id };

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
        existingInvoiceDate: dupResult.existingInvoiceDate,
        message: dupResult.message ?? "Ghi đè hóa đơn trùng lặp",
      };
    }

    // ── 3. Create AP Invoice + Lines (atomic transaction) ──────────────────
    let newInvoiceId!: number;

    await sequelize.transaction(async (t: Transaction) => {
      const invoice = await ApInvoice.create(
        {
          source: input.source,
          invoice_no: input.invoice_no,
          invoice_date: input.invoice_date,
          due_date: input.due_date,
          supplier_id: input.supplier_id,
          po_id: input.po_id ?? undefined,
          branch_id: input.branch_id,
          created_by: input.created_by,
          approval_status: "draft",
          status: "draft",
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
            product_id: line.product_id ?? undefined,
            description: line.description ?? "",
            quantity: qty,
            unit_price: price,
            uom_id: line.uom_id ?? null,
            tax_rate_id: line.tax_rate_id ?? undefined,
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
      duplicateWarning,
      matchingResult,
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
    if (![Role.ACCOUNT].includes(user.role)) {
      throw {
        status: 403,
        message: "You do not have permission to create AP Invoice",
      };
    }

    const po = await PurchaseOrder.findByPk(poId);
    if (!po) throw { status: 404, message: "Purchase Order not found" };

    if (po.branch_id !== user.branch_id) {
      throw {
        status: 403,
        message: "You cannot create invoice for another branch",
      };
    }

    if (po.status !== "confirmed" && po.status !== "completed") {
      throw {
        status: 400,
        message:
          "Only CONFIRMED And COMPLETED Purchase Orders can create AP Invoice",
      };
    }

    // Kiểm tra đã có invoice cho PO này chưa (logic cũ giữ nguyên)
    const existed = await ApInvoice.findOne({ where: { po_id: po.id } });
    if (existed) {
      throw {
        status: 400,
        message: "AP Invoice already exists for this Purchase Order",
      };
    }

    const poLines = await PurchaseOrderLine.findAll({
      where: { po_id: po.id },
    });
    if (!poLines.length) {
      throw { status: 400, message: "Purchase Order has no line items" };
    }

    const invoiceNo = `AP-${new Date().getFullYear()}-${Date.now()}`;
    const invoiceDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    const lines: CreateAPInvoiceLineInput[] = poLines.map((line) => ({
      product_id: line.product_id ?? null,
      description: po.description ?? "",
      quantity: Number(line.quantity),
      unit_price: Number(line.unit_price),
      uom_id: line.uom_id ?? null,
      tax_rate_id: line.tax_rate_id ?? null,
      line_total: Number(line.line_total),
      line_tax: Number(line.line_tax ?? 0),
      line_total_after_tax: Number(line.line_total_after_tax),
      po_line_id: line.id,
    }));

    const result = await this.createAPInvoice(
      {
        source: "manual",
        invoice_no: invoiceNo,
        invoice_date: invoiceDate,
        due_date: dueDate,
        supplier_id: po.supplier_id!,
        po_id: po.id,
        branch_id: po.branch_id,
        created_by: user.id,
        total_before_tax: Number(po.total_before_tax),
        total_tax: Number(po.total_tax),
        total_after_tax: Number(po.total_after_tax),
        lines,
      },
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
    if (user.role !== Role.CHACC)
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
        },
        { transaction: t },
      );

      const INVENTORY_ACC_ID = 8;
      const VAT_INPUT_ACC_ID = 4;
      const AP_ACC_ID = 5;

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
    if (user.role !== Role.CHACC) {
      throw new Error("Only Chief Accountant can reject");
    }

    const invoice = await ApInvoice.findByPk(id);
    if (!invoice) throw new Error("AP Invoice not found");

    if (invoice.branch_id !== user.branch_id) {
      throw new Error("You cannot reject invoice from another branch");
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

  // ─── REPORTS ───────────────────────────────────────────────────────────────

  async getPostedSummaryBySupplier(supplierId: number, user: any) {
    const invoices: any[] = await sequelize.query(
      `
      SELECT
        ai.id,
        ai.invoice_no,
        ai.invoice_date,
        ai.total_after_tax,
        ai.po_id,
        COALESCE(ai.total_after_tax - SUM(apa.applied_amount), ai.total_after_tax)
          AS outstanding_amount,
        po.po_no,
        p.id   AS supplier_id,
        p.name AS supplier_name
      FROM ap_invoices ai
      LEFT JOIN purchase_orders po ON po.id = ai.po_id
      JOIN partners p ON p.id = ai.supplier_id
      LEFT JOIN ap_payment_allocations apa ON apa.ap_invoice_id = ai.id
      WHERE ai.branch_id = :branchId
        AND ai.status IN ('posted')
        AND ai.supplier_id = :supplierId
      GROUP BY ai.id, po.id, p.id
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
      where: { branch_id: user.branch_id, status: "posted" },
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
};
