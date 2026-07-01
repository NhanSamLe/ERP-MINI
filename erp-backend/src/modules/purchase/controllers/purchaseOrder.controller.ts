import { purchaseOrderService } from "../services/purchaseOrder.service";
import { searchService } from "../services/searchService";
import { bulkActionService } from "../services/bulkActionService";
import { validationService } from "../services/validationService";
import { Request, Response } from "express";
import { SearchQuery } from "../services/searchService";

export const purchaseOrderController = {
  async getAllPO(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      // Use enhanced filter method — supports receipt_status, invoice_status, buyer_id, overdue_delivery
      const hasFilters = Object.keys(req.query).length > 0;
      const data = hasFilters
        ? await purchaseOrderService.getAllPOWithFilters(req.query, user)
        : await purchaseOrderService.getAllPO(user);
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  },

  async getByStatus(req: Request, res: Response) {
    const statusParam = req.query.status as string;
    if (!statusParam) {
      return res.status(400).json({ message: "status is required" });
    }

    const user = (req as any).user;
    const statusList = statusParam.split(",");
    try {
      const data = await purchaseOrderService.getByStatus(statusList, user);
      return res.json(data);
    } catch (err) {
      return res.status(500).json({ message: "Server error" });
    }
  },

  async getPOById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const data = await purchaseOrderService.getPOById(id);
      res.json(data);
    } catch (e: any) {
      res.status(404).json({ message: "Purchase order not found" });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = await purchaseOrderService.create(req.body, user);
      res.status(201).json(data);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const user = (req as any).user;
      const data = await purchaseOrderService.update(id, req.body, user);
      res.json(data);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  },
  async deletedPO(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const user = (req as any).user;
      await purchaseOrderService.delete(id, user);
      res.status(200).json({ message: "Deleted" });
    } catch (e: any) {
      const status = e.status || 400;
      const message = e.message || "Something went wrong";
      res.status(status).json({ message });
    }
  },

  async submitForApproval(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const user = (req as any).user;

      const data = await purchaseOrderService.submitForApproval(
        id,
        user,
        req.app,
      );
      res.json(data);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  },
  async approvePO(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const user = (req as any).user;

      const result = await purchaseOrderService.approvalPO(id, user, req.app);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  },

  async cancelPO(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const user = (req as any).user;
      const { reason } = req.body;

      const result = await purchaseOrderService.cancelPO(
        id,
        user,
        reason,
        req.app,
      );
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  },
  async getAvailableForInvoice(req: Request, res: Response) {
    const user = (req as any).user;

    const data = await purchaseOrderService.getAvailablePurchaseOrders(user);
    return res.json({
      success: true,
      data,
    });
  },

  async getPoInvoiceSummary(req: Request, res: Response) {
    const user = (req as any).user;
    try {
      const poId = Number(req.params.id);
      const data = await purchaseOrderService.getPoInvoiceSummary(poId, user);
      return res.json({ success: true, data });
    } catch (e: any) {
      const status = e.status || 500;
      return res.status(status).json({ message: e.message });
    }
  },

  /**
   * Tìm kiếm PO với các filter
   * GET /api/purchase-orders/search
   */
  async search(req: Request, res: Response) {
    try {
      const user = (req as any).user;

      const filters: SearchQuery = {
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
        sort_order: (req.query.sort_order as "ASC" | "DESC") || "DESC",
      };
      if (req.query.po_no) filters.po_no = req.query.po_no as string;
      if (req.query.supplier_id) filters.supplier_id = parseInt(req.query.supplier_id as string, 10);
      const statusQuery = req.query.status || req.query["status[]"];
      if (statusQuery) {
        if (Array.isArray(statusQuery)) {
          filters.status = statusQuery as string[];
        } else if (typeof statusQuery === "string") {
          filters.status = statusQuery.split(",");
        }
      }
      if (req.query.date_from) filters.date_from = req.query.date_from as string;
      if (req.query.date_to) filters.date_to = req.query.date_to as string;
      if (req.query.total_from) filters.total_from = parseFloat(req.query.total_from as string);
      if (req.query.total_to) filters.total_to = parseFloat(req.query.total_to as string);
      if (req.query.sort_by) filters.sort_by = req.query.sort_by as string;

      const result = await searchService.search(filters, user.branch_id);

      return res.status(200).json({
        success: true,
        data: result.items,
        pagination: result.pagination,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Lỗi khi tìm kiếm đơn đặt hàng",
      });
    }
  },

  /**
   * Phê duyệt hàng loạt PO
   * POST /api/purchase-orders/bulk-approve
   */
  async bulkApprove(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { po_ids } = req.body;

      const result = await bulkActionService.approveBulk(po_ids, user, req.app);

      return res.status(200).json(result);
    } catch (error: any) {
      const status = error.status || 500;
      return res.status(status).json({
        success: false,
        message: error.message || "Lỗi khi phê duyệt hàng loạt",
      });
    }
  },

  /**
   * Hủy hàng loạt PO
   * POST /api/purchase-orders/bulk-cancel
   */
  async bulkCancel(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { po_ids, reason } = req.body;

      const result = await bulkActionService.cancelBulk(
        po_ids,
        reason,
        user,
        req.app,
      );

      return res.status(200).json(result);
    } catch (error: any) {
      const status = error.status || 500;
      return res.status(status).json({
        success: false,
        message: error.message || "Lỗi khi hủy hàng loạt",
      });
    }
  },
};
