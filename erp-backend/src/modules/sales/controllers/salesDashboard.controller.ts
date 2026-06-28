import { Op, fn, col, literal, Sequelize } from "sequelize";
import { Request, Response } from "express";
import {
  SaleOrder,
  ArInvoice,
  ArReceipt,
  SalesReturn,
  StockBalance,
  Product,
  Partner,
  Branch,
  User,
  sequelize
} from "../../../models";
import * as XLSX from "xlsx";

// helper parse date range
function parseDateRange(query: any) {
  let startDate = new Date();
  let endDate = new Date();

  if (query.date_from && query.date_to) {
    startDate = new Date(query.date_from);
    startDate.setHours(0, 0, 0, 0);
    endDate = new Date(query.date_to);
    endDate.setHours(23, 59, 59, 999);
    return { startDate, endDate };
  }

  const period = query.period || "last_30_days";
  endDate = new Date();

  switch (period) {
    case "today":
      startDate.setHours(0, 0, 0, 0);
      break;
    case "last_7_days":
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
      break;
    case "last_30_days":
      startDate.setDate(startDate.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
      break;
    case "ytd":
      startDate = new Date(startDate.getFullYear(), 0, 1, 0, 0, 0, 0);
      break;
    default:
      startDate.setDate(startDate.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
  }
  return { startDate, endDate };
}

// Scoping logic helper
async function buildSalesScopes(user: any, reqBranchId: any) {
  const userId = user.id;
  const userRole = user.role;
  const userBranchId = user.branch_id;

  const orderWhere: any = {};
  const invoiceWhere: any = {};
  const receiptWhere: any = {};
  const returnWhere: any = {};
  const invoiceInclude: any[] = [];

  if (userRole === "SALES") {
    orderWhere.sales_person_id = userId;
    invoiceWhere["$order.sales_person_id$"] = userId;
    invoiceInclude.push({ model: SaleOrder, as: "order", attributes: ["sales_person_id"] });
    receiptWhere.customer_id = { [Op.in]: literal(`(SELECT id FROM partners WHERE sales_person_id = ${userId})`) };
    returnWhere.customer_id = { [Op.in]: literal(`(SELECT id FROM partners WHERE sales_person_id = ${userId})`) };

    if (userBranchId) {
      orderWhere.branch_id = userBranchId;
      invoiceWhere.branch_id = userBranchId;
      receiptWhere.branch_id = userBranchId;
      returnWhere.branch_id = userBranchId;
    }
  } else if (userRole === "SALESMANAGER" || userRole === "BRANCH_MANAGER") {
    if (userBranchId) {
      orderWhere.branch_id = userBranchId;
      invoiceWhere.branch_id = userBranchId;
      receiptWhere.branch_id = userBranchId;
      returnWhere.branch_id = userBranchId;
    }
  } else if (userRole === "CEO" || userRole === "ADMIN") {
    if (reqBranchId) {
      const qbId = Number(reqBranchId);
      orderWhere.branch_id = qbId;
      invoiceWhere.branch_id = qbId;
      receiptWhere.branch_id = qbId;
      returnWhere.branch_id = qbId;
    }
  }

  return { orderWhere, invoiceWhere, receiptWhere, returnWhere, invoiceInclude };
}

export const salesDashboardController = {
  async getDashboardData(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { startDate, endDate } = parseDateRange(req.query);
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const { orderWhere, invoiceWhere, receiptWhere, returnWhere, invoiceInclude } = await buildSalesScopes(user, req.query.branch_id);

      // ===============================================================
      // 1. SUMMARY METRICS (IN PERIOD OR CUMULATIVE)
      // ===============================================================

      // Net Sales (Invoiced) in period - posted only
      const netSalesData = await ArInvoice.findOne({
        attributes: [[fn("SUM", literal("ArInvoice.total_before_tax * ArInvoice.exchange_rate")), "total"]],
        where: {
          ...invoiceWhere,
          status: "posted",
          invoice_date: { [Op.between]: [startDate, endDate] }
        },
        include: invoiceInclude,
        raw: true
      }) as any;
      const netSales = Number(netSalesData?.total ?? 0);

      // Cash Collected (Receipts) in period - posted only
      const cashCollectedData = await ArReceipt.findOne({
        attributes: [[fn("SUM", literal("amount * exchange_rate")), "total"]],
        where: {
          ...receiptWhere,
          status: "posted",
          receipt_date: { [Op.between]: [startDate, endDate] }
        },
        raw: true
      }) as any;
      const cashCollected = Number(cashCollectedData?.total ?? 0);

      // Outstanding AR (Cumulative, no date filter)
      const outstandingArData = await ArInvoice.findOne({
        attributes: [[fn("SUM", literal("(ArInvoice.total_after_tax - ArInvoice.paid_amount) * ArInvoice.exchange_rate")), "total"]],
        where: {
          ...invoiceWhere,
          status: { [Op.in]: ["posted", "partially_paid"] }
        },
        include: invoiceInclude,
        raw: true
      }) as any;
      const outstandingAr = Number(outstandingArData?.total ?? 0);

      // Return Rate in period
      const returnData = await SalesReturn.findOne({
        attributes: [[fn("SUM", col("total_return_amount")), "total"]],
        where: {
          ...returnWhere,
          status: "completed",
          return_date: { [Op.between]: [startDate, endDate] }
        },
        raw: true
      }) as any;
      const returnAmount = Number(returnData?.total ?? 0);
      const returnRate = netSales > 0 ? Number(((returnAmount / netSales) * 100).toFixed(2)) : 0;

      // ===============================================================
      // 2. TREND CHARTS (REVENUE VS COLLECTION)
      // ===============================================================
      const revenueVsCollection: any[] = [];
      if (diffDays <= 31) {
        const current = new Date(startDate);
        while (current <= endDate) {
          const dayStart = new Date(current);
          dayStart.setHours(0, 0, 0, 0);
          const dayEnd = new Date(current);
          dayEnd.setHours(23, 59, 59, 999);
          const dateStr = dayStart.toISOString().substring(0, 10);

          const revData = await ArInvoice.findOne({
            attributes: [[fn("SUM", literal("ArInvoice.total_before_tax * ArInvoice.exchange_rate")), "total"]],
            where: { ...invoiceWhere, status: "posted", invoice_date: { [Op.between]: [dayStart, dayEnd] } },
            include: invoiceInclude,
            raw: true
          }) as any;

          const collData = await ArReceipt.findOne({
            attributes: [[fn("SUM", literal("amount * exchange_rate")), "total"]],
            where: { ...receiptWhere, status: "posted", receipt_date: { [Op.between]: [dayStart, dayEnd] } },
            raw: true
          }) as any;

          revenueVsCollection.push({
            date: dateStr,
            revenue: Number(revData?.total ?? 0),
            collected: Number(collData?.total ?? 0)
          });
          current.setDate(current.getDate() + 1);
        }
      } else {
        const current = new Date(startDate);
        current.setDate(1);
        while (current <= endDate) {
          const year = current.getFullYear();
          const month = current.getMonth();
          const start = new Date(year, month, 1, 0, 0, 0, 0);
          const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}`;

          const revData = await ArInvoice.findOne({
            attributes: [[fn("SUM", literal("ArInvoice.total_before_tax * ArInvoice.exchange_rate")), "total"]],
            where: { ...invoiceWhere, status: "posted", invoice_date: { [Op.between]: [start, end] } },
            include: invoiceInclude,
            raw: true
          }) as any;

          const collData = await ArReceipt.findOne({
            attributes: [[fn("SUM", literal("amount * exchange_rate")), "total"]],
            where: { ...receiptWhere, status: "posted", receipt_date: { [Op.between]: [start, end] } },
            raw: true
          }) as any;

          revenueVsCollection.push({
            date: dateStr,
            revenue: Number(revData?.total ?? 0),
            collected: Number(collData?.total ?? 0)
          });
          current.setMonth(current.getMonth() + 1);
        }
      }

      // ===============================================================
      // 3. ACCOUNTS RECEIVABLE AGING
      // ===============================================================
      const unpaidInvoices = await ArInvoice.findAll({
        attributes: ["id", "invoice_no", "due_date", "total_after_tax", "paid_amount", "exchange_rate"],
        where: {
          ...invoiceWhere,
          status: { [Op.in]: ["posted", "partially_paid"] }
        },
        include: invoiceInclude
      }) as any[];

      let group0_30 = 0;
      let group31_60 = 0;
      let group61_90 = 0;
      let groupOver90 = 0;
      const today = new Date();

      for (const inv of unpaidInvoices) {
        const remaining = (Number(inv.total_after_tax || 0) - Number(inv.paid_amount || 0)) * Number(inv.exchange_rate || 1);
        if (remaining <= 0) continue;

        const dueDate = new Date(inv.due_date);
        const timeDiff = today.getTime() - dueDate.getTime();
        const daysOverdue = Math.ceil(timeDiff / (1000 * 300 * 12 * 24)); // Calculate days overdue

        if (daysOverdue <= 0) {
          // Not overdue yet, can be included in 0-30 days or a separate group. For simplicity, group in 0-30 days.
          group0_30 += remaining;
        } else if (daysOverdue <= 30) {
          group0_30 += remaining;
        } else if (daysOverdue <= 60) {
          group31_60 += remaining;
        } else if (daysOverdue <= 90) {
          group61_90 += remaining;
        } else {
          groupOver90 += remaining;
        }
      }

      const arAging = [
        { range: "0-30 ngày", amount: Math.round(group0_30) },
        { range: "31-60 ngày", amount: Math.round(group31_60) },
        { range: "61-90 ngày", amount: Math.round(group61_90) },
        { range: ">90 ngày", amount: Math.round(groupOver90) }
      ];

      // ===============================================================
      // 4. LOW STOCK ALERTS (INVENTORY WARNINGS)
      // ===============================================================
      const stockBalanceData = await StockBalance.findAll({
        include: [{
          model: Product,
          as: "product",
          attributes: ["id", "name", "sku", "min_stock_qty"],
          where: { min_stock_qty: { [Op.gt]: 0 } },
          required: true
        }]
      }) as any[];

      const lowStockItems = stockBalanceData
        .filter((item: any) =>
          Number(item.quantity || 0) < Number(item.product?.min_stock_qty || 0)
        )
        .slice(0, 10)
        .map((item: any) => ({
          productId: item.product_id,
          name: item.product?.name || `Product #${item.product_id}`,
          sku: item.product?.sku || "",
          stock: Number(item.quantity || 0),
          minStockQty: Number(item.product?.min_stock_qty || 0)
        }));

      // ===============================================================
      // 5. OVERDUE CUSTOMERS ALERT
      // ===============================================================
      const overdueInvoicesList = await ArInvoice.findAll({
        where: {
          ...invoiceWhere,
          status: { [Op.in]: ["posted", "partially_paid"] },
          due_date: { [Op.lt]: new Date() }
        },
        include: [
          ...invoiceInclude,
          { model: Partner, as: "customer", attributes: ["id", "name"] }
        ],
        limit: 10,
        order: [["due_date", "ASC"]]
      }) as any[];

      const overdueCustomers = overdueInvoicesList.map((inv: any) => {
        const remaining = Number(inv.total_after_tax || 0) - Number(inv.paid_amount || 0);
        const overdueDays = Math.ceil((today.getTime() - new Date(inv.due_date).getTime()) / (1000 * 60 * 60 * 24));
        return {
          invoiceId: inv.id,
          invoiceNo: inv.invoice_no,
          customerName: inv.customer?.name || "Khách hàng ẩn danh",
          amount: remaining,
          days: overdueDays
        };
      });

      return res.json({
        success: true,
        data: {
          role: user.role,
          startDate,
          endDate,
          summary: {
            netSales,
            cashCollected,
            outstandingAr,
            returnRate
          },
          charts: {
            revenueVsCollection,
            arAging
          },
          alerts: {
            lowStockItems,
            overdueCustomers
          }
        }
      });

    } catch (err) {
      const msg = err instanceof Error ? err.message : "Server error";
      console.error("Sales Dashboard Error:", err);
      return res.status(500).json({ success: false, message: msg });
    }
  },

  async exportDashboardExcel(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { startDate, endDate } = parseDateRange(req.query);
      const { orderWhere, invoiceWhere, receiptWhere, returnWhere, invoiceInclude } = await buildSalesScopes(user, req.query.branch_id);

      // Fetch sales data
      const netSalesData = await ArInvoice.findOne({
        attributes: [[fn("SUM", literal("ArInvoice.total_before_tax * ArInvoice.exchange_rate")), "total"]],
        where: { ...invoiceWhere, status: "posted", invoice_date: { [Op.between]: [startDate, endDate] } },
        include: invoiceInclude,
        raw: true
      }) as any;
      const netSales = Number(netSalesData?.total ?? 0);

      const cashCollectedData = await ArReceipt.findOne({
        attributes: [[fn("SUM", literal("amount * exchange_rate")), "total"]],
        where: { ...receiptWhere, status: "posted", receipt_date: { [Op.between]: [startDate, endDate] } },
        raw: true
      }) as any;
      const cashCollected = Number(cashCollectedData?.total ?? 0);

      const outstandingArData = await ArInvoice.findOne({
        attributes: [[fn("SUM", literal("(ArInvoice.total_after_tax - ArInvoice.paid_amount) * ArInvoice.exchange_rate")), "total"]],
        where: { ...invoiceWhere, status: { [Op.in]: ["posted", "partially_paid"] } },
        include: invoiceInclude,
        raw: true
      }) as any;
      const outstandingAr = Number(outstandingArData?.total ?? 0);

      const returnData = await SalesReturn.findOne({
        attributes: [[fn("SUM", col("total_return_amount")), "total"]],
        where: { ...returnWhere, status: "completed", return_date: { [Op.between]: [startDate, endDate] } },
        raw: true
      }) as any;
      const returnAmount = Number(returnData?.total ?? 0);
      const returnRate = netSales > 0 ? Number(((returnAmount / netSales) * 100).toFixed(2)) : 0;

      // 1. Summary sheet data
      const summaryData = [
        { "Chỉ số báo cáo": "Doanh số bán hàng (Net Sales)", "Giá trị (VND)": netSales },
        { "Chỉ số báo cáo": "Thực thu quỹ (Cash Collected)", "Giá trị (VND)": cashCollected },
        { "Chỉ số báo cáo": "Công nợ phải thu (AR Outstanding)", "Giá trị (VND)": outstandingAr },
        { "Chỉ số báo cáo": "Tổng tiền hàng trả lại", "Giá trị (VND)": returnAmount },
        { "Chỉ số báo cáo": "Tỷ lệ trả hàng (%)", "Giá trị (VND)": returnRate }
      ];

      // 2. Trend sheet data (Group monthly/daily values)
      const invoicesList = await ArInvoice.findAll({
        attributes: ["invoice_no", "invoice_date", "total_before_tax", "exchange_rate"],
        where: { ...invoiceWhere, status: "posted", invoice_date: { [Op.between]: [startDate, endDate] } },
        include: invoiceInclude
      }) as any[];
      
      const invoiceExcelData = invoicesList.map((inv) => ({
        "Mã hóa đơn": inv.invoice_no,
        "Ngày hóa đơn": inv.invoice_date ? new Date(inv.invoice_date).toLocaleDateString("vi-VN") : "",
        "Doanh số gốc": Number(inv.total_before_tax),
        "Tỷ giá": Number(inv.exchange_rate),
        "Doanh số quy đổi (VND)": Number(inv.total_before_tax || 0) * Number(inv.exchange_rate || 1)
      }));

      // 3. Unpaid aging sheet data
      const unpaidInvoices = await ArInvoice.findAll({
        attributes: ["invoice_no", "due_date", "total_after_tax", "paid_amount", "exchange_rate"],
        where: { ...invoiceWhere, status: { [Op.in]: ["posted", "partially_paid"] } },
        include: [
          ...invoiceInclude,
          { model: Partner, as: "customer", attributes: ["name"] }
        ]
      }) as any[];

      const today = new Date();
      const agingExcelData = unpaidInvoices.map((inv) => {
        const remaining = (Number(inv.total_after_tax || 0) - Number(inv.paid_amount || 0)) * Number(inv.exchange_rate || 1);
        const dueDate = new Date(inv.due_date);
        const overdueDays = Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        let ageGroup = "Chưa quá hạn";
        if (overdueDays > 90) ageGroup = ">90 ngày";
        else if (overdueDays > 60) ageGroup = "61-90 ngày";
        else if (overdueDays > 30) ageGroup = "31-60 ngày";
        else if (overdueDays > 0) ageGroup = "0-30 ngày";

        return {
          "Mã hóa đơn": inv.invoice_no,
          "Khách hàng": inv.customer?.name || "Khách hàng ẩn",
          "Hạn thanh toán": dueDate.toLocaleDateString("vi-VN"),
          "Số ngày trễ": overdueDays > 0 ? overdueDays : 0,
          "Phân loại tuổi nợ": ageGroup,
          "Số tiền nợ còn lại (VND)": Math.round(remaining)
        };
      });

      // Create Workbook
      const wb = XLSX.utils.book_new();

      const wsSummary = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, wsSummary, "Tổng quan chỉ số");

      const wsInvoices = XLSX.utils.json_to_sheet(invoiceExcelData);
      XLSX.utils.book_append_sheet(wb, wsInvoices, "Chi tiết doanh thu");

      const wsAging = XLSX.utils.json_to_sheet(agingExcelData);
      XLSX.utils.book_append_sheet(wb, wsAging, "Tuổi nợ AR Aging");

      // Write to buffer
      const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", "attachment; filename=sales-dashboard-report.xlsx");
      return res.send(buffer);

    } catch (err) {
      const msg = err instanceof Error ? err.message : "Server error";
      console.error("Export Excel Error:", err);
      return res.status(500).json({ success: false, message: msg });
    }
  }
};
