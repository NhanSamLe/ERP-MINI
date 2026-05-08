export class KPIFormulas {
  /**
   * Tính Gross Profit Margin
   */
  static calculateGrossMargin(revenue: number, cogs: number): number {
    if (revenue === 0) return 0;
    return ((revenue - cogs) / revenue) * 100;
  }

  /**
   * Tính Net Profit Margin
   */
  static calculateNetMargin(netProfit: number, revenue: number): number {
    if (revenue === 0) return 0;
    return (netProfit / revenue) * 100;
  }

  /**
   * Tính Days Sales Outstanding (DSO)
   */
  static calculateDSO(
    accountsReceivable: number,
    dailyRevenue: number,
  ): number {
    if (dailyRevenue === 0) return 0;
    return accountsReceivable / dailyRevenue;
  }

  /**
   * Tính Days Payable Outstanding (DPO)
   */
  static calculateDPO(accountsPayable: number, dailyCOGS: number): number {
    if (dailyCOGS === 0) return 0;
    return accountsPayable / dailyCOGS;
  }

  /**
   * Tính Inventory Turnover
   */
  static calculateInventoryTurnover(
    cogs: number,
    averageInventory: number,
  ): number {
    if (averageInventory === 0) return 0;
    return cogs / averageInventory;
  }

  /**
   * Tính Days Inventory Outstanding (DIO)
   */
  static calculateDIO(inventory: number, dailyCOGS: number): number {
    if (dailyCOGS === 0) return 0;
    return inventory / dailyCOGS;
  }

  /**
   * Tính Cash Conversion Cycle
   */
  static calculateCCC(dso: number, dio: number, dpo: number): number {
    return dso + dio - dpo;
  }

  /**
   * Tính Return on Assets (ROA)
   */
  static calculateROA(netProfit: number, totalAssets: number): number {
    if (totalAssets === 0) return 0;
    return (netProfit / totalAssets) * 100;
  }

  /**
   * Tính Return on Equity (ROE)
   */
  static calculateROE(netProfit: number, equity: number): number {
    if (equity === 0) return 0;
    return (netProfit / equity) * 100;
  }

  /**
   * Tính Current Ratio
   */
  static calculateCurrentRatio(
    currentAssets: number,
    currentLiabilities: number,
  ): number {
    if (currentLiabilities === 0) return 0;
    return currentAssets / currentLiabilities;
  }

  /**
   * Tính Quick Ratio
   */
  static calculateQuickRatio(
    currentAssets: number,
    inventory: number,
    currentLiabilities: number,
  ): number {
    if (currentLiabilities === 0) return 0;
    return (currentAssets - inventory) / currentLiabilities;
  }

  /**
   * Tính Debt to Equity Ratio
   */
  static calculateDebtToEquity(totalDebt: number, equity: number): number {
    if (equity === 0) return 0;
    return totalDebt / equity;
  }

  /**
   * Tính percent change
   */
  static calculatePercentChange(current: number, previous: number): number {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  }

  /**
   * Tính trend direction
   */
  static determineTrend(percentChange: number): "up" | "down" | "stable" {
    if (percentChange > 2) return "up";
    if (percentChange < -2) return "down";
    return "stable";
  }

  /**
   * Xác định alert level
   */
  static determineAlertLevel(
    percentChange: number,
  ): "high" | "medium" | "low" | undefined {
    const absChange = Math.abs(percentChange);
    if (absChange > 30) return "high";
    if (absChange > 15) return "medium";
    if (absChange > 5) return "low";
    return undefined;
  }
}
