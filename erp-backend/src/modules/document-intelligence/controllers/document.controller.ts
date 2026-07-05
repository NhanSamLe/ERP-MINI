import { Request, Response } from "express";
import { DocumentService } from "../services/document.service";
import { DuplicateDetectorService } from "../services/duplicateDetector.service";
import { ThreeWayMatcherService } from "../services/threeWayMatcher.service";
import { ApInvoice } from "../../purchase/models/apInvoice.model";

const documentService = new DocumentService();

function handleError(res: Response, err: any) {
  const status = typeof err?.status === "number" ? err.status : 500;
  const message = err?.message ?? "Đã xảy ra lỗi, vui lòng thử lại";
  res.status(status).json({ message });
}

export const documentController = {
  /** POST /api/documents/upload */
  async uploadDocument(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      if (!req.file) {
        return res.status(400).json({ message: "Không có file được tải lên" });
      }
      const result = await documentService.uploadDocument(
        req.file,
        user.branch_id,
        user.id,
      );
      res.status(200).json(result);
    } catch (err: any) {
      handleError(res, err);
    }
  },

  /** GET /api/documents/:id/status */
  async getDocumentStatus(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const documentId = Number(req.params.id);
      const result = await documentService.getDocumentStatus(
        documentId,
        user.branch_id,
      );
      res.status(200).json(result);
    } catch (err: any) {
      handleError(res, err);
    }
  },

  /** GET /api/documents/:id/result */
  async getDocumentResult(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const documentId = Number(req.params.id);
      const result = await documentService.getEnrichedResult(
        documentId,
        user.branch_id,
      );
      res.status(200).json(result);
    } catch (err: any) {
      handleError(res, err);
    }
  },

  /** POST /api/documents/:id/confirm */
  async confirmDocument(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const documentId = Number(req.params.id);
      const result = await documentService.confirmDocument(
        documentId,
        user.branch_id,
        user.id,
        req.body,
      );
      res.status(201).json(result);
    } catch (err: any) {
      handleError(res, err);
    }
  },

  /** POST /api/documents/check-duplicate */
  async checkDuplicate(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { invoice_no, supplier_id, branch_id } = req.body;

      if (!invoice_no || invoice_no.toString().trim() === "") {
        return res
          .status(400)
          .json({ message: "Số hóa đơn (invoice_no) là bắt buộc" });
      }

      if (!supplier_id) {
        return res
          .status(400)
          .json({ message: "Mã nhà cung cấp (supplier_id) là bắt buộc" });
      }

      if (branch_id !== user.branch_id) {
        return res.status(403).json({ message: "Không có quyền truy cập" });
      }

      const duplicateDetector = new DuplicateDetectorService();
      const result = await duplicateDetector.check(
        invoice_no,
        supplier_id,
        branch_id,
      );
      res.status(200).json(result);
    } catch (err: any) {
      handleError(res, err);
    }
  },

  /** GET /api/documents/po-suggestions?supplier_id=2 */
  async getPOSuggestions(req: Request, res: Response) {
    try {
      const supplierId = req.query.supplier_id
        ? Number(req.query.supplier_id)
        : undefined;

      const { Op } = await import("sequelize");
      const { PurchaseOrder } =
        await import("../../purchase/models/purchaseOrder.model");

      const where: any = {
        status: { [Op.in]: ["confirmed", "sent", "supplier_accepted", "partially_received", "received"] },
      };
      if (supplierId) where.supplier_id = supplierId;

      const pos = await PurchaseOrder.findAll({
        where,
        attributes: [
          "id",
          "po_no",
          "supplier_id",
          "branch_id",
          "order_date",
          "total_after_tax",
          "status",
        ],
        order: [["created_at", "DESC"]],
        limit: 50,
      });

      res.status(200).json({ data: pos });
    } catch (err: any) {
      handleError(res, err);
    }
  },

  /** GET /api/documents/history */
  async getHistory(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const page = Number(req.query.page ?? 1);
      const limit = Number(req.query.limit ?? 20);
      const ocr_status = req.query.ocr_status as string | undefined;
      const date_from = req.query.date_from
        ? new Date(req.query.date_from as string)
        : undefined;
      const date_to = req.query.date_to
        ? new Date(req.query.date_to as string)
        : undefined;

      const filters = {
        ...(ocr_status !== undefined && { ocr_status }),
        ...(date_from !== undefined && { date_from }),
        ...(date_to !== undefined && { date_to }),
      };

      const result = await documentService.getDocumentHistory(
        user.branch_id,
        filters,
        { page, limit },
      );
      res.status(200).json(result);
    } catch (err: any) {
      handleError(res, err);
    }
  },

  /** POST /api/matching/three-way */
  async threeWayMatch(req: Request, res: Response) {
    try {
      const { invoiceId } = req.body;
      const matcher = new ThreeWayMatcherService();
      const result = await matcher.match(invoiceId);
      res.status(200).json(result);
    } catch (err: any) {
      handleError(res, err);
    }
  },

  /** GET /api/matching/:invoiceId */
  async getMatchingResult(req: Request, res: Response) {
    try {
      const invoiceId = Number(req.params.invoiceId);
      const invoice = await ApInvoice.findByPk(invoiceId);
      if (!invoice) {
        return res.status(404).json({ message: "Không tìm thấy hóa đơn" });
      }
      res.status(200).json({
        matching_status: invoice.matching_status,
        matching_details: invoice.matching_details,
      });
    } catch (err: any) {
      handleError(res, err);
    }
  },
};
