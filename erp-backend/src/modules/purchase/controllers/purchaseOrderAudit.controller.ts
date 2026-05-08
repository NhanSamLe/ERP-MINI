import { Request, Response } from "express";
import { auditService } from "../services/auditService";
import { AuditLogFilterDto } from "../dto/bulkActionRequest.dto";

export const purchaseOrderAuditController = {
  /**
   * Lấy audit logs của một PO
   * GET /api/purchase-orders/:id/audit-logs
   */
  async getAuditLogs(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const po_id = parseInt(id, 10);

      if (isNaN(po_id)) {
        return res.status(400).json({
          success: false,
          message: "ID đơn đặt hàng không hợp lệ",
        });
      }

      const filters: AuditLogFilterDto = {
        action: req.query.action as string,
        date_from: req.query.date_from as string,
        date_to: req.query.date_to as string,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
      };

      const result = await auditService.getAuditLogs(po_id, filters);

      return res.status(200).json({
        success: true,
        data: result.logs,
        pagination: result.pagination,
      });
    } catch (error: any) {
      console.error("Error getting audit logs:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Lỗi khi lấy lịch sử thay đổi",
      });
    }
  },

  /**
   * Lấy lịch sử thay đổi của một PO (dạng readable)
   * GET /api/purchase-orders/:id/audit-history
   */
  async getAuditHistory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const po_id = parseInt(id, 10);

      if (isNaN(po_id)) {
        return res.status(400).json({
          success: false,
          message: "ID đơn đặt hàng không hợp lệ",
        });
      }

      const history = await auditService.getAuditHistory(po_id);

      return res.status(200).json({
        success: true,
        data: history,
      });
    } catch (error: any) {
      console.error("Error getting audit history:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Lỗi khi lấy lịch sử thay đổi",
      });
    }
  },
};
