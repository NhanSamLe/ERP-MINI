import { PurchaseOrder, User, PurchaseOrderAuditLog } from "../../../models";
import { Op } from "sequelize";

export interface AuditLogFilter {
  action?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}

export interface AuditLogResult {
  logs: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const auditService = {
  /**
   * Ghi log khi tạo PO
   */
  async logCreate(po: any, user: any): Promise<void> {
    try {
      await PurchaseOrderAuditLog.create({
        po_id: po.id,
        action: "CREATE",
        old_values: null,
        new_values: {
          po_no: po.po_no,
          supplier_id: po.supplier_id,
          order_date: po.order_date,
          total_before_tax: po.total_before_tax,
          total_tax: po.total_tax,
          total_after_tax: po.total_after_tax,
          status: po.status,
          description: po.description,
        },
        changed_by: user.id,
        changed_at: new Date(),
        branch_id: po.branch_id,
      });
    } catch (error) {
      console.error("Error logging PO creation:", error);
      // Không throw error, chỉ log để không ảnh hưởng đến main flow
    }
  },

  /**
   * Ghi log khi cập nhật PO
   */
  async logUpdate(
    po: any,
    oldValues: any,
    newValues: any,
    user: any,
  ): Promise<void> {
    try {
      await PurchaseOrderAuditLog.create({
        po_id: po.id,
        action: "UPDATE",
        old_values: oldValues,
        new_values: newValues,
        changed_by: user.id,
        changed_at: new Date(),
        branch_id: po.branch_id,
      });
    } catch (error) {
      console.error("Error logging PO update:", error);
    }
  },

  /**
   * Ghi log khi phê duyệt PO
   */
  async logApprove(po: any, user: any): Promise<void> {
    try {
      await PurchaseOrderAuditLog.create({
        po_id: po.id,
        action: "APPROVE",
        old_values: {
          status: "waiting_approval",
        },
        new_values: {
          status: "confirmed",
          approved_by: user.id,
          approved_at: new Date(),
        },
        changed_by: user.id,
        changed_at: new Date(),
        branch_id: po.branch_id,
      });
    } catch (error) {
      console.error("Error logging PO approval:", error);
    }
  },

  /**
   * Ghi log khi hủy PO
   */
  async logCancel(po: any, reason: string, user: any): Promise<void> {
    try {
      await PurchaseOrderAuditLog.create({
        po_id: po.id,
        action: "CANCEL",
        old_values: {
          status: "waiting_approval",
        },
        new_values: {
          status: "cancelled",
          approved_by: user.id,
          approved_at: new Date(),
          reject_reason: reason,
        },
        changed_by: user.id,
        changed_at: new Date(),
        branch_id: po.branch_id,
      });
    } catch (error) {
      console.error("Error logging PO cancellation:", error);
    }
  },

  /**
   * Lấy audit logs của một PO
   */
  async getAuditLogs(
    po_id: number,
    filters: AuditLogFilter,
  ): Promise<AuditLogResult> {
    // Validate pagination
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 20));
    const offset = (page - 1) * limit;

    // Build where clause
    const where: any = { po_id };

    if (filters.action) {
      where.action = filters.action;
    }

    if (filters.date_from || filters.date_to) {
      where.changed_at = {};

      if (filters.date_from) {
        where.changed_at[Op.gte] = new Date(filters.date_from);
      }

      if (filters.date_to) {
        const dateTo = new Date(filters.date_to);
        dateTo.setHours(23, 59, 59, 999);
        where.changed_at[Op.lte] = dateTo;
      }
    }

    // Execute query
    const { count, rows } = await PurchaseOrderAuditLog.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: "changedByUser",
          attributes: ["id", "full_name", "email"],
          foreignKey: "changed_by",
        },
      ],
      order: [["changed_at", "DESC"]],
      limit,
      offset,
      subQuery: false,
    });

    // Calculate pagination
    const totalPages = Math.ceil(count / limit);

    // Format response
    const logs = rows.map((log: any) => ({
      id: log.id,
      po_id: log.po_id,
      action: log.action,
      old_values: log.old_values,
      new_values: log.new_values,
      changed_by: log.changed_by,
      changed_by_name: log.changedByUser?.full_name || "Unknown",
      changed_at: log.changed_at,
    }));

    return {
      logs,
      pagination: {
        page,
        limit,
        total: count,
        totalPages,
      },
    };
  },

  /**
   * Lấy lịch sử thay đổi của một PO (dạng readable)
   */
  async getAuditHistory(po_id: number): Promise<any[]> {
    const logs = await PurchaseOrderAuditLog.findAll({
      where: { po_id },
      include: [
        {
          model: User,
          as: "changedByUser",
          attributes: ["id", "full_name", "email"],
          foreignKey: "changed_by",
        },
      ],
      order: [["changed_at", "ASC"]],
    });

    return logs.map((log: any) => ({
      id: log.id,
      action: log.action,
      changed_by_name: log.changedByUser?.full_name || "Unknown",
      changed_at: log.changed_at,
      old_values: log.old_values,
      new_values: log.new_values,
    }));
  },

  /**
   * Xóa audit logs cũ (retention policy)
   */
  async deleteOldLogs(daysToKeep: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await PurchaseOrderAuditLog.destroy({
      where: {
        changed_at: {
          [Op.lt]: cutoffDate,
        },
      },
    });

    return result;
  },

  /**
   * Ghi log khi gửi email PO cho nhà cung cấp
   */
  async logSendEmail(po: any, supplierEmail: string, user: any): Promise<void> {
    try {
      await PurchaseOrderAuditLog.create({
        po_id: po.id,
        action: "SEND_EMAIL",
        old_values: {
          status: po.status,
        },
        new_values: {
          status: "sent",
          recipient: supplierEmail,
          sent_at: new Date(),
        },
        changed_by: user.id,
        changed_at: new Date(),
        branch_id: po.branch_id,
      });
    } catch (error) {
      console.error("Error logging PO email sending:", error);
    }
  },
};
