export enum NarrativeType {
  MONTHLY_REPORT = "monthly_report",
  SALES_PERFORMANCE = "sales_performance",
  VENDOR_PERFORMANCE = "vendor_performance",
  CASH_FLOW = "cash_flow",
  PRODUCT_ANALYSIS = "product_analysis",
}

// KPI Data Structure
export interface KPIData {
  metric: string;
  currentValue: number;
  previousValue: number;
  percentChange: number;
  trend: "up" | "down" | "stable";
  alert?: "high" | "medium" | "low";
  benchmark?: number;
}

// Monthly Report KPIs
export interface MonthlyReportKPIs {
  revenue: KPIData;
  costOfGoodsSold: KPIData;
  grossProfit: KPIData;
  grossMargin: KPIData;
  operatingExpenses: KPIData;
  netProfit: KPIData;
  netMargin: KPIData;
  inventory: KPIData;
  receivables: KPIData;
  payables: KPIData;
}

// Narrative Config
export interface NarrativeConfigInterface {
  id: number;
  companyId: number;
  narrativeType: NarrativeType;
  templateName: string;
  promptTemplate: string;
  tone: "formal" | "casual" | "analytical";
  language: string;
  maxTokens: number;
  temperature: number;
  isActive: boolean;
}

// Narrative Output
export interface NarrativeOutput {
  id?: string;
  narrativeType: NarrativeType;
  period: {
    startDate: string;
    endDate: string;
  };
  narrative: string;
  keyInsights: string[];
  risks: string[];
  recommendations: string[];
  metadata: {
    tokensUsed: number;
    generationTimeMs: number;
    model: string;
    temperature: number;
  };
  generatedAt: string;
}

// Request/Response DTOs
export interface GenerateNarrativeRequest {
  companyId: number;
  narrativeType: NarrativeType;
  periodStart: string;
  periodEnd: string;
  filters?: Record<string, any>;
  forceRefresh?: boolean;
}

export interface GenerateNarrativeResponse {
  success: boolean;
  data?: NarrativeOutput;
  error?: string;
  cacheHit?: boolean;
}
