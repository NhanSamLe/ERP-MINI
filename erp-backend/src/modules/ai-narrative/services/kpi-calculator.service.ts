import { Sequelize } from "sequelize";
import { MonthlyReportKPIs, KPIData } from "../types/narrative.types";
import { KPIFormulas } from "../utils/kpi-formulas";

export class KPICalculatorService {
  constructor(private sequelize: Sequelize) {}

  /**
   * Calculate KPIs for monthly report
   */
  async calculateMonthlyReportKPIs(
    companyId: number,
    periodStart: string,
    periodEnd: string,
  ): Promise<MonthlyReportKPIs> {
    try {
      // Get current period data
      const currentData = await this.getFinancialData(
        companyId,
        periodStart,
        periodEnd,
      );

      // Get previous period data for comparison
      const previousStart = this.getPreviousPeriodStart(periodStart);
      const previousEnd = this.getPreviousPeriodEnd(periodStart);
      const previousData = await this.getFinancialData(
        companyId,
        previousStart,
        previousEnd,
      );

      // Calculate KPIs
      return {
        revenue: this.calculateKPI(
          "Revenue",
          currentData.revenue,
          previousData.revenue,
        ),
        costOfGoodsSold: this.calculateKPI(
          "Cost of Goods Sold",
          currentData.costOfGoodsSold,
          previousData.costOfGoodsSold,
        ),
        grossProfit: this.calculateKPI(
          "Gross Profit",
          currentData.grossProfit,
          previousData.grossProfit,
        ),
        grossMargin: this.calculateKPI(
          "Gross Margin %",
          currentData.grossMargin,
          previousData.grossMargin,
        ),
        operatingExpenses: this.calculateKPI(
          "Operating Expenses",
          currentData.operatingExpenses,
          previousData.operatingExpenses,
        ),
        netProfit: this.calculateKPI(
          "Net Profit",
          currentData.netProfit,
          previousData.netProfit,
        ),
        netMargin: this.calculateKPI(
          "Net Margin %",
          currentData.netMargin,
          previousData.netMargin,
        ),
        inventory: this.calculateKPI(
          "Inventory",
          currentData.inventory,
          previousData.inventory,
        ),
        receivables: this.calculateKPI(
          "Receivables",
          currentData.receivables,
          previousData.receivables,
        ),
        payables: this.calculateKPI(
          "Payables",
          currentData.payables,
          previousData.payables,
        ),
      };
    } catch (error) {
      console.error("Error calculating KPIs:", error);
      throw error;
    }
  }

  /**
   * Get financial data from database
   */
  private async getFinancialData(
    companyId: number,
    periodStart: string,
    periodEnd: string,
  ): Promise<any> {
    try {
      const salesResult = await this.sequelize.query(
        `SELECT SUM(total_after_tax) as revenue
        FROM sale_orders
        WHERE status = 'completed'
          AND created_at BETWEEN ? AND ?`,
        { replacements: [periodStart, periodEnd], type: "SELECT" },
      );

      const purchaseResult = await this.sequelize.query(
        `SELECT SUM(total_after_tax) as costOfGoodsSold
        FROM purchase_orders
        WHERE status = 'completed'
          AND created_at BETWEEN ? AND ?`,
        { replacements: [periodStart, periodEnd], type: "SELECT" },
      );

      const inventoryResult = await this.sequelize.query(
        `SELECT SUM(total_value) as inventory FROM stock_balances`,
        { replacements: [], type: "SELECT" },
      );

      const arResult = await this.sequelize.query(
        `SELECT SUM(total_after_tax) as receivables
        FROM ar_invoices WHERE status IN ('posted', 'partially_paid')`,
        { replacements: [], type: "SELECT" },
      );

      const apResult = await this.sequelize.query(
        `SELECT SUM(total_after_tax) as payables
        FROM ap_invoices WHERE status IN ('posted', 'partially_paid')`,
        { replacements: [], type: "SELECT" },
      );

      const revenue = (salesResult as any)[0]?.revenue || 0;
      const costOfGoodsSold = (purchaseResult as any)[0]?.costOfGoodsSold || 0;
      const grossProfit = revenue - costOfGoodsSold;
      const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
      const operatingExpenses = grossProfit * 0.2;
      const netProfit = grossProfit - operatingExpenses;
      const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
      const inventory = (inventoryResult as any)[0]?.inventory || 0;
      const receivables = (arResult as any)[0]?.receivables || 0;
      const payables = (apResult as any)[0]?.payables || 0;

      return {
        revenue,
        costOfGoodsSold,
        grossProfit,
        grossMargin,
        operatingExpenses,
        netProfit,
        netMargin,
        inventory,
        receivables,
        payables,
      };
    } catch (error) {
      console.error("Error fetching financial data:", error);
      throw error;
    }
  }

  /**
   * Calculate individual KPI
   */
  private calculateKPI(
    metric: string,
    currentValue: number,
    previousValue: number,
  ): KPIData {
    const percentChange = KPIFormulas.calculatePercentChange(
      currentValue,
      previousValue,
    );
    const trend = KPIFormulas.determineTrend(percentChange);
    const alert = KPIFormulas.determineAlertLevel(percentChange);

    return {
      metric,
      currentValue,
      previousValue,
      percentChange,
      trend,
      ...(alert && { alert }),
    };
  }

  /**
   * Get previous period start date
   */
  private getPreviousPeriodStart(periodStart: string): string {
    const date = new Date(periodStart);
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split("T")[0] as string;
  }

  /**
   * Get previous period end date
   */
  private getPreviousPeriodEnd(periodStart: string): string {
    const date = new Date(periodStart);
    date.setDate(0); // Last day of previous month
    return date.toISOString().split("T")[0] as string;
  }

  /**
   * Calculate KPIs for sales performance
   */
  async calculateSalesPerformanceKPIs(
    companyId: number,
    periodStart: string,
    periodEnd: string,
  ): Promise<any> {
    const topProducts = await this.sequelize.query(
      `SELECT p.name, SUM(sol.line_total_after_tax) as revenue, COUNT(*) as qty
       FROM sale_order_lines sol
       JOIN products p ON p.id = sol.product_id
       JOIN sale_orders so ON so.id = sol.order_id
       WHERE so.status = 'completed'
         AND so.created_at BETWEEN ? AND ?
       GROUP BY p.id, p.name
       ORDER BY revenue DESC
       LIMIT 5`,
      { replacements: [periodStart, periodEnd], type: "SELECT" },
    );

    const totalSales = await this.sequelize.query(
      `SELECT COUNT(*) as orderCount, SUM(total_after_tax) as totalRevenue
       FROM sale_orders
       WHERE status = 'completed' AND created_at BETWEEN ? AND ?`,
      { replacements: [periodStart, periodEnd], type: "SELECT" },
    );

    const prevStart = this.getPreviousPeriodStart(periodStart);
    const prevEnd = this.getPreviousPeriodEnd(periodStart);
    const prevSales = await this.sequelize.query(
      `SELECT SUM(total_after_tax) as totalRevenue
       FROM sale_orders
       WHERE status = 'completed' AND created_at BETWEEN ? AND ?`,
      { replacements: [prevStart, prevEnd], type: "SELECT" },
    );

    const currentRevenue = (totalSales as any)[0]?.totalRevenue || 0;
    const prevRevenue = (prevSales as any)[0]?.totalRevenue || 0;
    const growth = KPIFormulas.calculatePercentChange(
      currentRevenue,
      prevRevenue,
    );

    return {
      totalRevenue: currentRevenue,
      previousRevenue: prevRevenue,
      revenueGrowth: growth,
      orderCount: (totalSales as any)[0]?.orderCount || 0,
      topProducts: topProducts,
    };
  }

  /**
   * Calculate KPIs for vendor performance
   */
  async calculateVendorPerformanceKPIs(
    companyId: number,
    periodStart: string,
    periodEnd: string,
  ): Promise<any> {
    const topVendors = await this.sequelize.query(
      `SELECT p.name, SUM(po.total_after_tax) as totalValue, COUNT(*) as orderCount
       FROM purchase_orders po
       JOIN partners p ON p.id = po.supplier_id
       WHERE po.status = 'completed'
         AND po.created_at BETWEEN ? AND ?
       GROUP BY p.id, p.name
       ORDER BY totalValue DESC
       LIMIT 5`,
      { replacements: [periodStart, periodEnd], type: "SELECT" },
    );

    const apOutstanding = await this.sequelize.query(
      `SELECT COUNT(*) as overdueCount, SUM(total_after_tax) as overdueAmount
       FROM ap_invoices
       WHERE status IN ('posted','partially_paid')
         AND due_date < NOW()`,
      { replacements: [], type: "SELECT" },
    );

    const totalPurchase = await this.sequelize.query(
      `SELECT SUM(total_after_tax) as total
       FROM purchase_orders
       WHERE status = 'completed' AND created_at BETWEEN ? AND ?`,
      { replacements: [periodStart, periodEnd], type: "SELECT" },
    );

    return {
      totalPurchase: (totalPurchase as any)[0]?.total || 0,
      topVendors: topVendors,
      overdueInvoices: (apOutstanding as any)[0]?.overdueCount || 0,
      overdueAmount: (apOutstanding as any)[0]?.overdueAmount || 0,
    };
  }

  /**
   * Calculate KPIs for cash flow
   */
  async calculateCashFlowKPIs(
    companyId: number,
    periodStart: string,
    periodEnd: string,
  ): Promise<any> {
    const arData = await this.sequelize.query(
      `SELECT SUM(total_after_tax) as totalAR,
              SUM(CASE WHEN status='posted' THEN total_after_tax ELSE 0 END) as outstandingAR
       FROM ar_invoices
       WHERE invoice_date BETWEEN ? AND ?`,
      { replacements: [periodStart, periodEnd], type: "SELECT" },
    );

    const apData = await this.sequelize.query(
      `SELECT SUM(total_after_tax) as totalAP,
              SUM(CASE WHEN status='posted' THEN total_after_tax ELSE 0 END) as outstandingAP
       FROM ap_invoices
       WHERE invoice_date BETWEEN ? AND ?`,
      { replacements: [periodStart, periodEnd], type: "SELECT" },
    );

    const salesData = await this.sequelize.query(
      `SELECT SUM(total_after_tax) as revenue
       FROM sale_orders WHERE status='completed' AND created_at BETWEEN ? AND ?`,
      { replacements: [periodStart, periodEnd], type: "SELECT" },
    );

    const purchaseData = await this.sequelize.query(
      `SELECT SUM(total_after_tax) as cogs
       FROM purchase_orders WHERE status='completed' AND created_at BETWEEN ? AND ?`,
      { replacements: [periodStart, periodEnd], type: "SELECT" },
    );

    const revenue = (salesData as any)[0]?.revenue || 0;
    const cogs = (purchaseData as any)[0]?.cogs || 0;
    const outstandingAR = (arData as any)[0]?.outstandingAR || 0;
    const outstandingAP = (apData as any)[0]?.outstandingAP || 0;
    const days = 30;
    const dso = revenue > 0 ? outstandingAR / (revenue / days) : 0;
    const dpo = cogs > 0 ? outstandingAP / (cogs / days) : 0;

    return {
      totalAR: (arData as any)[0]?.totalAR || 0,
      outstandingAR,
      totalAP: (apData as any)[0]?.totalAP || 0,
      outstandingAP,
      dso: parseFloat(dso.toFixed(1)),
      dpo: parseFloat(dpo.toFixed(1)),
      revenue,
      cogs,
    };
  }
}
