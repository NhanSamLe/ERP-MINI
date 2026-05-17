import { Request, Response } from "express";
import { apInvoiceService } from "../services/apInvoice.service";
import { apInvoiceAuditLogService } from "../services/apInvoiceAuditLog.service";

function handleError(res: Response, err: any) {
  const status = typeof err?.status === "number" ? err.status : 500;
  const message = err?.message ?? "Đã xảy ra lỗi, vui lòng thử lại";
  // Trả về thêm thông tin duplicate nếu có (status 409)
  if (err?.duplicate) {
    return res
      .status(status)
      .json({ success: false, message, duplicate: err.duplicate });
  }
  res.status(status).json({ success: false, message });
}

export const apInvoiceController = {
  // ─── READ ──────────────────────────────────────────────────────────────────

  async getAll(req: Request, res: Response) {
    const user = (req as any).user;
    try {
      const data = await apInvoiceService.getAll(req.query, user);
      res.json({ success: true, data });
    } catch (error: any) {
      handleError(res, error);
    }
  },

  /**
   * GET /api/ap/invoices/:id
   * Trả về invoice đầy đủ kèm matching_details và audit trail
   */
  async getById(req: Request, res: Response) {
    const user = (req as any).user;
    try {
      const invoice = await apInvoiceService.getById(
        Number(req.params.id),
        user,
      );

      if (!invoice) {
        return res
          .status(404)
          .json({ success: false, message: "AP Invoice not found" });
      }

      // Lấy audit trail kèm theo
      const auditTrail = await apInvoiceAuditLogService.getAuditTrail(
        invoice.id,
      );

      res.json({
        success: true,
        data: {
          ...invoice.toJSON(),
          audit_trail: auditTrail,
        },
      });
    } catch (error: any) {
      handleError(res, error);
    }
  },

  // ─── CREATE ────────────────────────────────────────────────────────────────

  /**
   * POST /api/ap/invoices
   * Tạo AP Invoice thủ công — không cần PO, không cần OCR.
   *
   * Body:
   * {
   *   invoice_no: string
   *   invoice_date: string (ISO)
   *   supplier_id: number
   *   po_id?: number | null
   *   lines: [{ product_id, quantity, unit_price, ... }]
   *   total_before_tax?: number
   *   total_tax?: number
   *   total_after_tax?: number
   *   overrideDuplicate?: boolean
   *   override_reason?: string
   * }
   *
   * Ví dụ: Kế toán tạo hóa đơn tiền điện tháng 5 (không có PO)
   */
  async createManual(req: Request, res: Response) {
    const user = (req as any).user;
    try {
      const body = req.body;

      // Validate bắt buộc ở controller level
      if (!body.invoice_no?.trim()) {
        return res
          .status(400)
          .json({ success: false, message: "invoice_no là bắt buộc" });
      }
      if (!body.supplier_id) {
        return res
          .status(400)
          .json({ success: false, message: "supplier_id là bắt buộc" });
      }
      if (!Array.isArray(body.lines) || body.lines.length === 0) {
        return res.status(400).json({
          success: false,
          message: "lines phải có ít nhất 1 dòng hàng",
        });
      }

      const result = await apInvoiceService.createAPInvoice(
        {
          source: "manual",
          invoice_no: body.invoice_no.trim(),
          invoice_date: body.invoice_date
            ? new Date(body.invoice_date)
            : new Date(),
          ...(body.due_date != null && { due_date: new Date(body.due_date) }),
          supplier_id: Number(body.supplier_id),
          po_id: body.po_id ? Number(body.po_id) : null,
          branch_id: user.branch_id,
          created_by: user.id,
          invoice_series: body.invoice_series ?? null,
          invoice_template: body.invoice_template ?? null,
          tax_code: body.tax_code ?? null,
          total_before_tax: Number(body.total_before_tax ?? 0),
          total_tax: Number(body.total_tax ?? 0),
          total_after_tax: Number(body.total_after_tax ?? 0),
          lines: body.lines.map((l: any) => ({
            product_id: l.product_id ?? null,
            description: l.description ?? "",
            quantity: Number(l.quantity),
            unit_price: Number(l.unit_price),
            uom_id: l.uom_id ?? null,
            tax_rate_id: l.tax_rate_id ?? null,
            line_total:
              l.line_total ?? Number(l.quantity) * Number(l.unit_price),
            line_tax: l.line_tax ?? 0,
            line_total_after_tax:
              l.line_total_after_tax ??
              l.line_total ??
              Number(l.quantity) * Number(l.unit_price),
            po_line_id: l.po_line_id ?? null,
          })),
          overrideDuplicate: body.overrideDuplicate ?? false,
          ...(body.override_reason != null && {
            override_reason: body.override_reason,
          }),
        },
        user,
      );

      res.status(201).json({
        success: true,
        message: "Tạo hóa đơn thành công",
        data: result.invoice,
        ...(result.duplicateWarning && {
          duplicateWarning: result.duplicateWarning,
        }),
        ...(result.matchingResult && { matchingResult: result.matchingResult }),
      });
    } catch (error: any) {
      handleError(res, error);
    }
  },

  /**
   * POST /api/ap/invoices/from-po/:poId
   * Tạo AP Invoice từ PO — backward compatible (full remaining)
   */
  async createFromPO(req: Request, res: Response) {
    try {
      const poId = Number(req.params.poId);
      const user = (req as any).user;
      const data = await apInvoiceService.createFromPO(poId, user);
      res.status(201).json({ success: true, data });
    } catch (e: any) {
      handleError(res, e);
    }
  },

  /**
   * POST /api/ap/invoices/from-po/:poId/partial
   * Tạo partial AP Invoice — user chọn lines và qty cụ thể.
   *
   * Body: { lines: [{ po_line_id: number, quantity: number }] }
   */
  async createPartialFromPO(req: Request, res: Response) {
    try {
      const poId = Number(req.params.poId);
      const user = (req as any).user;
      const { lines } = req.body;

      if (!Array.isArray(lines) || lines.length === 0) {
        return res.status(400).json({
          success: false,
          message: "lines is required and must not be empty",
        });
      }

      const data = await apInvoiceService.createPartialFromPO(
        poId,
        lines,
        user,
        {
          invoice_no: req.body.invoice_no,
          invoice_date: req.body.invoice_date,
          due_date: req.body.due_date,
          invoice_series: req.body.invoice_series,
          invoice_template: req.body.invoice_template,
          tax_code: req.body.tax_code,
        },
      );
      res.status(201).json({ success: true, data });
    } catch (e: any) {
      handleError(res, e);
    }
  },

  // ─── APPROVAL WORKFLOW ─────────────────────────────────────────────────────

  async submitForApproval(req: Request, res: Response) {
    const user = (req as any).user;
    try {
      const data = await apInvoiceService.submitForApproval(
        Number(req.params.id),
        user,
        req.app,
      );
      res.json({
        success: true,
        message: "Invoice submitted for approval",
        data,
      });
    } catch (error: any) {
      handleError(res, error);
    }
  },

  async approve(req: Request, res: Response) {
    const user = (req as any).user;
    try {
      const data = await apInvoiceService.approve(Number(req.params.id), user);
      res.json({
        success: true,
        message: "Invoice approved successfully",
        data,
      });
    } catch (error: any) {
      handleError(res, error);
    }
  },

  async reject(req: Request, res: Response) {
    const user = (req as any).user;
    try {
      const { reason } = req.body;
      if (!reason?.trim()) {
        return res
          .status(400)
          .json({ success: false, message: "Reject reason is required" });
      }
      const data = await apInvoiceService.reject(
        Number(req.params.id),
        reason,
        user,
        req.app,
      );
      res.json({
        success: true,
        message: "Invoice rejected successfully",
        data,
      });
    } catch (error: any) {
      handleError(res, error);
    }
  },

  /**
   * DELETE /api/ap/invoices/:id
   * Xóa AP Invoice — chỉ khi draft + chưa submit + người tạo.
   */
  async deleteInvoice(req: Request, res: Response) {
    const user = (req as any).user;
    try {
      await apInvoiceService.deleteInvoice(Number(req.params.id), user);
      res.json({ success: true, message: "Invoice deleted successfully" });
    } catch (error: any) {
      handleError(res, error);
    }
  },

  // ─── AUDIT LOGS ────────────────────────────────────────────────────────────

  async getAuditLogs(req: Request, res: Response) {
    const user = (req as any).user;
    try {
      const invoice = await apInvoiceService.getById(
        Number(req.params.id),
        user,
      );
      if (!invoice) {
        return res
          .status(404)
          .json({ success: false, message: "AP Invoice not found" });
      }
      const logs = await apInvoiceAuditLogService.getAuditTrail(invoice.id);
      res.json({ success: true, data: logs });
    } catch (error: any) {
      handleError(res, error);
    }
  },

  // ─── PAYMENT HISTORY ───────────────────────────────────────────────────────

  /**
   * GET /api/ap/invoices/:id/payments
   * Lịch sử thanh toán của 1 AP Invoice — danh sách allocations + tổng đã trả + còn nợ.
   */
  async getPaymentHistory(req: Request, res: Response) {
    const user = (req as any).user;
    try {
      const data = await apInvoiceService.getPaymentHistory(
        Number(req.params.id),
        user,
      );
      res.json({ success: true, data });
    } catch (error: any) {
      handleError(res, error);
    }
  },

  // ─── REPORTS ───────────────────────────────────────────────────────────────

  async getPostedSummaryBySupplier(req: Request, res: Response) {
    const user = (req as any).user;
    try {
      const supplierId = Number(req.query.supplier_id);
      if (!supplierId) {
        return res
          .status(400)
          .json({ success: false, message: "supplier_id is required" });
      }
      const result = await apInvoiceService.getPostedSummaryBySupplier(
        supplierId,
        user,
      );
      return res.json({ success: true, data: result });
    } catch (error: any) {
      handleError(res, error);
    }
  },

  async getPostedSuppliers(req: Request, res: Response) {
    const user = (req as any).user;
    try {
      const data = await apInvoiceService.getPostedSuppliers(user);
      res.json({ success: true, data });
    } catch (e: any) {
      handleError(res, e);
    }
  },
};
