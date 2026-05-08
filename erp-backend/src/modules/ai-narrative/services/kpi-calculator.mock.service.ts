import { MonthlyReportKPIs } from "../types/narrative.types";

/**
 * Mock KPI Calculator Service - Để test mà không cần dữ liệu thực
 */
export class KPICalculatorMockService {
  /**
   * Trả về dữ liệu KPI giả
   */
  async calculateMonthlyReportKPIs(
    companyId: number,
    periodStart: string,
    periodEnd: string,
  ): Promise<MonthlyReportKPIs> {
    // Dữ liệu giả cho tháng 3/2025
    return {
      revenue: {
        metric: "Doanh Thu",
        currentValue: 1200000000, // 1.2B
        previousValue: 850000000, // 850M
        percentChange: 41.18,
        trend: "up",
        alert: "high",
      },
      costOfGoodsSold: {
        metric: "Chi Phí Hàng Bán",
        currentValue: 780000000, // 780M
        previousValue: 600000000, // 600M
        percentChange: 30,
        trend: "up",
        alert: "medium",
      },
      grossProfit: {
        metric: "Lợi Nhuận Gộp",
        currentValue: 420000000, // 420M
        previousValue: 250000000, // 250M
        percentChange: 68,
        trend: "up",
        alert: "high",
      },
      grossMargin: {
        metric: "Biên Lợi Nhuận Gộp",
        currentValue: 35, // 35%
        previousValue: 29.41, // 29.41%
        percentChange: 19,
        trend: "up",
      },
      operatingExpenses: {
        metric: "Chi Phí Hoạt Động",
        currentValue: 84000000, // 84M (20% of gross profit)
        previousValue: 50000000, // 50M
        percentChange: 68,
        trend: "up",
      },
      netProfit: {
        metric: "Lợi Nhuận Ròng",
        currentValue: 336000000, // 336M
        previousValue: 200000000, // 200M
        percentChange: 68,
        trend: "up",
        alert: "high",
      },
      netMargin: {
        metric: "Biên Lợi Nhuận Ròng",
        currentValue: 28, // 28%
        previousValue: 23.53, // 23.53%
        percentChange: 19,
        trend: "up",
      },
      inventory: {
        metric: "Tồn Kho",
        currentValue: 180000000, // 180M
        previousValue: 320000000, // 320M
        percentChange: -43.75,
        trend: "down",
        alert: "high",
      },
      receivables: {
        metric: "Phải Thu",
        currentValue: 500000000, // 500M
        previousValue: 400000000, // 400M
        percentChange: 25,
        trend: "up",
      },
      payables: {
        metric: "Phải Trả",
        currentValue: 300000000, // 300M
        previousValue: 250000000, // 250M
        percentChange: 20,
        trend: "up",
      },
    };
  }
}
