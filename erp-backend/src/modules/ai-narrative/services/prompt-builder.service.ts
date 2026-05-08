import {
  MonthlyReportKPIs,
  NarrativeConfigInterface,
} from "../types/narrative.types";
import { PROMPT_TEMPLATES } from "../utils/prompt-templates";

export class PromptBuilderService {
  /**
   * Build prompt for monthly report narrative
   */
  buildMonthlyReportPrompt(
    kpis: MonthlyReportKPIs,
    config: NarrativeConfigInterface,
  ): string {
    const kpiData = this.formatKPIData(kpis);
    // Ưu tiên dùng template từ DB config, fallback về hardcoded template
    const template = config.promptTemplate || PROMPT_TEMPLATES.MONTHLY_REPORT;
    return template
      .replace("{kpi_data}", kpiData)
      .replace("{DATA_CONTEXT}", kpiData);
  }

  /**
   * Build prompt for sales performance narrative
   */
  buildSalesPerformancePrompt(
    salesData: any,
    config: NarrativeConfigInterface,
  ): string {
    const formattedData = this.formatSalesData(salesData);
    const template =
      config.promptTemplate || PROMPT_TEMPLATES.SALES_PERFORMANCE;
    return template
      .replace("{kpi_data}", formattedData)
      .replace("{DATA_CONTEXT}", formattedData);
  }

  /**
   * Build prompt for vendor performance narrative
   */
  buildVendorPerformancePrompt(
    vendorData: any,
    config: NarrativeConfigInterface,
  ): string {
    const formattedData = this.formatVendorData(vendorData);
    const template =
      config.promptTemplate || PROMPT_TEMPLATES.VENDOR_PERFORMANCE;
    return template
      .replace("{kpi_data}", formattedData)
      .replace("{DATA_CONTEXT}", formattedData);
  }

  /**
   * Build prompt for cash flow narrative
   */
  buildCashFlowPrompt(
    cashFlowData: any,
    config: NarrativeConfigInterface,
  ): string {
    const formattedData = this.formatCashFlowData(cashFlowData);
    const template = config.promptTemplate || PROMPT_TEMPLATES.CASH_FLOW;
    return template
      .replace("{kpi_data}", formattedData)
      .replace("{DATA_CONTEXT}", formattedData);
  }

  /**
   * Format KPI data for prompt
   */
  private formatKPIData(kpis: MonthlyReportKPIs): string {
    const lines: string[] = [];

    lines.push("📊 Chỉ số tài chính:");
    lines.push(
      `- Doanh thu: ${this.formatNumber(kpis.revenue.currentValue)} (${this.formatPercent(kpis.revenue.percentChange)})`,
    );
    lines.push(
      `- Chi phí hàng bán: ${this.formatNumber(kpis.costOfGoodsSold.currentValue)} (${this.formatPercent(kpis.costOfGoodsSold.percentChange)})`,
    );
    lines.push(
      `- Lợi nhuận gộp: ${this.formatNumber(kpis.grossProfit.currentValue)} (${this.formatPercent(kpis.grossProfit.percentChange)})`,
    );
    lines.push(
      `- Biên lợi nhuận gộp: ${kpis.grossMargin.currentValue.toFixed(2)}% (${this.formatPercent(kpis.grossMargin.percentChange)})`,
    );
    lines.push(
      `- Chi phí hoạt động: ${this.formatNumber(kpis.operatingExpenses.currentValue)} (${this.formatPercent(kpis.operatingExpenses.percentChange)})`,
    );
    lines.push(
      `- Lợi nhuận ròng: ${this.formatNumber(kpis.netProfit.currentValue)} (${this.formatPercent(kpis.netProfit.percentChange)})`,
    );
    lines.push(
      `- Biên lợi nhuận ròng: ${kpis.netMargin.currentValue.toFixed(2)}% (${this.formatPercent(kpis.netMargin.percentChange)})`,
    );
    lines.push(
      `- Tồn kho: ${this.formatNumber(kpis.inventory.currentValue)} (${this.formatPercent(kpis.inventory.percentChange)})`,
    );
    lines.push(
      `- Phải thu: ${this.formatNumber(kpis.receivables.currentValue)} (${this.formatPercent(kpis.receivables.percentChange)})`,
    );
    lines.push(
      `- Phải trả: ${this.formatNumber(kpis.payables.currentValue)} (${this.formatPercent(kpis.payables.percentChange)})`,
    );

    return lines.join("\n");
  }

  /**
   * Format sales data for prompt
   */
  private formatSalesData(salesData: any): string {
    const lines: string[] = [];
    lines.push("📈 Dữ liệu bán hàng:");
    lines.push(
      `- Tổng doanh thu: ${this.formatNumber(salesData.totalRevenue || 0)}`,
    );
    lines.push(
      `- Doanh thu kỳ trước: ${this.formatNumber(salesData.previousRevenue || 0)}`,
    );
    lines.push(
      `- Tăng trưởng: ${this.formatPercent(salesData.revenueGrowth || 0)}`,
    );
    lines.push(`- Số đơn hàng: ${salesData.orderCount || 0}`);
    const products = Array.isArray(salesData.topProducts)
      ? salesData.topProducts
      : [];
    if (products.length > 0) {
      lines.push("Top sản phẩm:");
      products.forEach((p: any, i: number) => {
        lines.push(
          `  ${i + 1}. ${p.name}: ${this.formatNumber(p.revenue || 0)} (${p.qty || 0} đơn)`,
        );
      });
    }
    return lines.join("\n");
  }

  /**
   * Format vendor data for prompt
   */
  private formatVendorData(vendorData: any): string {
    const lines: string[] = [];
    lines.push("🏢 Dữ liệu nhà cung cấp:");
    lines.push(
      `- Tổng giá trị mua hàng: ${this.formatNumber(vendorData.totalPurchase || 0)}`,
    );
    lines.push(
      `- Hóa đơn quá hạn: ${vendorData.overdueInvoices || 0} (${this.formatNumber(vendorData.overdueAmount || 0)})`,
    );
    const vendors = Array.isArray(vendorData.topVendors)
      ? vendorData.topVendors
      : [];
    if (vendors.length > 0) {
      lines.push("Top nhà cung cấp:");
      vendors.forEach((v: any, i: number) => {
        lines.push(
          `  ${i + 1}. ${v.name}: ${this.formatNumber(v.totalValue || 0)} (${v.orderCount || 0} đơn)`,
        );
      });
    }
    return lines.join("\n");
  }

  /**
   * Format cash flow data for prompt
   */
  private formatCashFlowData(cashFlowData: any): string {
    const lines: string[] = [];
    lines.push("💰 Dữ liệu dòng tiền:");
    lines.push(
      `- Tổng phải thu (AR): ${this.formatNumber(cashFlowData.totalAR || 0)}`,
    );
    lines.push(
      `- AR chưa thu: ${this.formatNumber(cashFlowData.outstandingAR || 0)}`,
    );
    lines.push(
      `- Tổng phải trả (AP): ${this.formatNumber(cashFlowData.totalAP || 0)}`,
    );
    lines.push(
      `- AP chưa trả: ${this.formatNumber(cashFlowData.outstandingAP || 0)}`,
    );
    lines.push(
      `- DSO (Days Sales Outstanding): ${cashFlowData.dso?.toFixed(1) ?? 0} ngày`,
    );
    lines.push(
      `- DPO (Days Payable Outstanding): ${cashFlowData.dpo?.toFixed(1) ?? 0} ngày`,
    );

    return lines.join("\n");
  }

  /**
   * Format number with Vietnamese locale
   */
  private formatNumber(value: number): string {
    if (value >= 1_000_000_000) {
      return `${(value / 1_000_000_000).toFixed(2)} tỷ VND`;
    } else if (value >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(2)} triệu VND`;
    } else if (value >= 1_000) {
      return `${(value / 1_000).toFixed(2)} nghìn VND`;
    }
    return `${value.toFixed(2)} VND`;
  }

  /**
   * Format percentage
   */
  private formatPercent(value: number): string {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(2)}%`;
  }
}
