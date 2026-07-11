import { Request, Response } from "express";
import { Op } from "sequelize";
import { PurchaseOrder } from "../../purchase/models/purchaseOrder.model";
import { Partner } from "../../partner/models/partner.model";

export const purchaseReportController = {
  /**
   * GET /api/reports/purchase/dashboard-stats
   * Lấy số liệu thống kê nhanh cho Dashboard Mua hàng
   */
  async dashboardStats(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const branchId = user?.branch_id;

      // Tạo where clause chung dựa theo chi nhánh nếu có
      const baseWhere: any = {};
      if (branchId) {
        baseWhere.branch_id = branchId;
      }

      const fromMonthStr = typeof req.query.fromMonth === "string" ? req.query.fromMonth : undefined;
      const toMonthStr = typeof req.query.toMonth === "string" ? req.query.toMonth : undefined;

      console.log("[Purchase Dashboard Stats] Filters received:", { fromMonthStr, toMonthStr });

      if (fromMonthStr || toMonthStr) {
        baseWhere.order_date = {};
        if (fromMonthStr) {
          const parts = fromMonthStr.split("-");
          const start = new Date(parseInt(parts[0] || "0"), parseInt(parts[1] || "1") - 1, 1, 0, 0, 0);
          baseWhere.order_date[Op.gte] = start;
        }
        if (toMonthStr) {
          const parts = toMonthStr.split("-");
          const end = new Date(parseInt(parts[0] || "0"), parseInt(parts[1] || "1"), 1, 0, 0, 0);
          baseWhere.order_date[Op.lt] = end;
        }
      }

      console.log("[Purchase Dashboard Stats] baseWhere:", baseWhere);

      // 1. Thống kê thẻ KPI
      const allOrders = await PurchaseOrder.findAll({
        where: {
          ...baseWhere,
          status: { [Op.ne]: "cancelled" },
        },
        attributes: ["id", "status", "total_after_tax", "order_date"],
        raw: true,
      });

      console.log("[Purchase Dashboard Stats] Orders count fetched:", allOrders.length);

      const totalSpend = allOrders.reduce(
        (acc, order) => acc + parseFloat(String(order.total_after_tax ?? 0)),
        0
      );

      const pendingApprovalCount = allOrders.filter(
        (order) => order.status === "waiting_approval"
      ).length;

      const totalOrdersCount = allOrders.length;

      const activeSuppliersCount = await Partner.count({
        where: {
          type: "supplier",
          status: "active",
        },
      });

      // 2. Xu hướng chi tiêu mua hàng theo tháng
      const trendsMonths: Record<string, { month: string; total: number; count: number }> = {};
      if (fromMonthStr && toMonthStr) {
        const startParts = fromMonthStr.split("-");
        const endParts = toMonthStr.split("-");
        let startY = parseInt(startParts[0] || "0");
        let startM = parseInt(startParts[1] || "1") - 1;
        const endY = parseInt(endParts[0] || "0");
        const endM = parseInt(endParts[1] || "1") - 1;

        const start = new Date(startY, startM, 1);
        const end = new Date(endY, endM, 1);

        while (start <= end) {
          const key = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`;
          trendsMonths[key] = { month: key, total: 0, count: 0 };
          start.setMonth(start.getMonth() + 1);
        }
      } else {
        const now = new Date();
        for (let i = 11; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          trendsMonths[key] = { month: key, total: 0, count: 0 };
        }
      }

      allOrders.forEach((order) => {
        if (!order.order_date) return;
        const oDate = new Date(order.order_date);
        const key = `${oDate.getFullYear()}-${String(oDate.getMonth() + 1).padStart(2, "0")}`;
        if (trendsMonths[key]) {
          trendsMonths[key].total += parseFloat(String(order.total_after_tax ?? 0));
          trendsMonths[key].count += 1;
        }
      });

      const trends = Object.values(trendsMonths);

      // 3. Phân bố trạng thái đơn hàng (gồm cả cancelled để hiển thị đầy đủ)
      const statusOrders = await PurchaseOrder.findAll({
        where: baseWhere,
        attributes: ["status"],
        raw: true,
      });
      const statusCounts: Record<string, number> = {};
      statusOrders.forEach((o) => {
        statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
      });
      const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count,
      }));

      // 4. Top 5 nhà cung cấp theo chi tiêu
      const poWithSuppliers = await PurchaseOrder.findAll({
        where: {
          ...baseWhere,
          status: { [Op.ne]: "cancelled" },
        },
        include: [
          {
            model: Partner,
            as: "supplier",
            attributes: ["id", "name", "phone", "email"],
          },
        ],
      });

      const supplierSpending: Record<
        number,
        { id: number; name: string; email: string; phone: string; total_spend: number; count: number }
      > = {};

      poWithSuppliers.forEach((po) => {
        const supplier = (po as any).supplier;
        if (!supplier) return;
        const sId = supplier.id;
        if (!supplierSpending[sId]) {
          supplierSpending[sId] = {
            id: sId,
            name: supplier.name,
            email: supplier.email || "",
            phone: supplier.phone || "",
            total_spend: 0,
            count: 0,
          };
        }
        supplierSpending[sId].total_spend += parseFloat(String(po.total_after_tax ?? 0));
        supplierSpending[sId].count += 1;
      });

      const topSuppliers = Object.values(supplierSpending)
        .sort((a, b) => b.total_spend - a.total_spend)
        .slice(0, 5);

      // 5. 5 Đơn mua hàng gần nhất
      const recentOrders = await PurchaseOrder.findAll({
        where: baseWhere,
        include: [
          {
            model: Partner,
            as: "supplier",
            attributes: ["id", "name"],
          },
        ],
        order: [["created_at", "DESC"]],
        limit: 5,
      });

      res.json({
        stats: {
          total_spend: totalSpend,
          pending_approval_count: pendingApprovalCount,
          total_orders_count: totalOrdersCount,
          active_suppliers_count: activeSuppliersCount,
        },
        trends,
        statusDistribution,
        topSuppliers,
        recentOrders,
      });
    } catch (err: any) {
      console.error("Error in purchase dashboard stats:", err);
      res.status(500).json({ message: err.message });
    }
  },
};
