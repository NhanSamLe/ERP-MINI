import { PurchaseOrder } from "../models/purchaseOrder.model";
import { auditService } from "./auditService";
import { notificationService } from "../../../core/services/notification.service";
import { sequelize } from "../../../config/db";
import { Op } from "sequelize";
import { Role } from "../../../core/types/enum";

export interface BulkResult {
  success: boolean;
  count: number;
  message: string;
  failed?: Array<{
    po_id: number;
    po_no: string;
    error: string;
  }>;
}

export const bulkActionService = {
  /**
   * Phê duyệt hàng loạt PO
   */
  async approveBulk(
    po_ids: number[],
    user: any,
    app?: any,
  ): Promise<BulkResult> {
    if (!po_ids || po_ids.length === 0) {
      throw {
        status: 400,
        message: "Danh sách đơn đặt hàng không được trống",
      };
    }

    if (user.role !== Role.PURCHASEMANAGER) {
      throw {
        status: 403,
        message: "Bạn không có quyền phê duyệt đơn đặt hàng",
      };
    }

    const failed: Array<{
      po_id: number;
      po_no: string;
      error: string;
    }> = [];
    let successCount = 0;

    // Lấy tất cả PO cần phê duyệt
    const pos = await PurchaseOrder.findAll({
      where: {
        id: {
          [Op.in]: po_ids,
        },
        branch_id: user.branch_id,
      },
    });

    if (pos.length === 0) {
      throw {
        status: 404,
        message: "Không tìm thấy đơn đặt hàng nào",
      };
    }

    // Xử lý từng PO trong transaction
    for (const po of pos) {
      try {
        await sequelize.transaction(async (t) => {
          // Kiểm tra trạng thái
          if (po.status !== "waiting_approval") {
            throw new Error(
              `Đơn đặt hàng ${po.po_no} không ở trạng thái chờ phê duyệt`,
            );
          }

          // Cập nhật trạng thái
          po.status = "confirmed";
          po.approved_by = user.id;
          po.approved_at = new Date();
          await po.save({ transaction: t });

          // Ghi log
          await auditService.logApprove(po, user);

          successCount++;
        });

        // Gửi thông báo
        if (app && po.created_by) {
          const io = app.get("io");
          await notificationService.createNotification({
            type: "APPROVE",
            referenceType: "PURCHASE_ORDER",
            referenceId: po.id,
            referenceNo: po.po_no,
            branchId: po.branch_id!,
            submitterId: po.created_by,
            approverName: user.full_name || user.username,
            io,
          });
        }
      } catch (error: any) {
        failed.push({
          po_id: po.id,
          po_no: po.po_no,
          error: error.message || "Lỗi không xác định",
        });
      }
    }

    return {
      success: failed.length === 0,
      count: successCount,
      message: `Đã phê duyệt ${successCount} đơn đặt hàng`,
      ...(failed.length > 0 && { failed }),
    };
  },

  /**
   * Hủy hàng loạt PO
   */
  async cancelBulk(
    po_ids: number[],
    reason: string,
    user: any,
    app?: any,
  ): Promise<BulkResult> {
    if (!po_ids || po_ids.length === 0) {
      throw {
        status: 400,
        message: "Danh sách đơn đặt hàng không được trống",
      };
    }

    if (!reason || reason.trim() === "") {
      throw {
        status: 400,
        message: "Lý do hủy không được để trống",
      };
    }

    if (user.role !== Role.PURCHASEMANAGER) {
      throw {
        status: 403,
        message: "Bạn không có quyền hủy đơn đặt hàng",
      };
    }

    const failed: Array<{
      po_id: number;
      po_no: string;
      error: string;
    }> = [];
    let successCount = 0;

    // Lấy tất cả PO cần hủy
    const pos = await PurchaseOrder.findAll({
      where: {
        id: {
          [Op.in]: po_ids,
        },
        branch_id: user.branch_id,
      },
    });

    if (pos.length === 0) {
      throw {
        status: 404,
        message: "Không tìm thấy đơn đặt hàng nào",
      };
    }

    // Xử lý từng PO trong transaction
    for (const po of pos) {
      try {
        await sequelize.transaction(async (t) => {
          // Kiểm tra trạng thái
          if (po.status !== "waiting_approval") {
            throw new Error(
              `Đơn đặt hàng ${po.po_no} không ở trạng thái chờ phê duyệt`,
            );
          }

          // Cập nhật trạng thái
          po.status = "cancelled";
          po.approved_by = user.id;
          po.approved_at = new Date();
          po.reject_reason = reason.trim();
          await po.save({ transaction: t });

          // Ghi log
          await auditService.logCancel(po, reason, user);

          successCount++;
        });

        // Gửi thông báo
        if (app && po.created_by) {
          const io = app.get("io");
          await notificationService.createNotification({
            type: "REJECT",
            referenceType: "PURCHASE_ORDER",
            referenceId: po.id,
            referenceNo: po.po_no,
            branchId: po.branch_id!,
            submitterId: po.created_by,
            approverName: user.full_name || user.username,
            rejectReason: reason,
            io,
          });
        }
      } catch (error: any) {
        failed.push({
          po_id: po.id,
          po_no: po.po_no,
          error: error.message || "Lỗi không xác định",
        });
      }
    }

    return {
      success: failed.length === 0,
      count: successCount,
      message: `Đã hủy ${successCount} đơn đặt hàng`,
      ...(failed.length > 0 && { failed }),
    };
  },

  /**
   * Lấy thống kê bulk actions
   */
  async getBulkStats(branchId: number): Promise<any> {
    const stats = await PurchaseOrder.findAll({
      attributes: [
        "status",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      where: {
        branch_id: branchId,
      },
      group: ["status"],
      raw: true,
    });

    return stats;
  },
};
