export type NarrativeType =
  | "monthly_report"
  | "sales_performance"
  | "vendor_performance"
  | "cash_flow";

export interface GenerateNarrativeRequest {
  companyId: number;
  narrativeType: NarrativeType;
  periodStart: string;
  periodEnd: string;
}

export interface GenerateNarrativeResponse {
  success: boolean;
  cacheHit: boolean;
  narrative: string;
  tokensUsed: number;
  costUSD: number;
  generatedAt: string;
  cachedAt?: string;
  error?: string;
}

export interface NarrativeLog {
  id: number;
  narrativeType: NarrativeType;
  narrative_type: NarrativeType; // alias cho backward compat
  period_start: string;
  period_end: string;
  periodStart: string;
  periodEnd: string;
  output_narrative: string;
  tokens_used: number;
  tokensUsed: number;
  cost_usd: number;
  costUsd: number;
  generation_time_ms: number;
  generationTimeMs: number;
  cache_hit: boolean;
  status: "success" | "failed" | "partial";
  created_at: string;
  createdAt: string;
}

export interface NarrativeLogsResponse {
  total: number;
  logs: NarrativeLog[];
}

export interface CacheStats {
  totalCached: number;
  cacheHits: number;
  cacheMisses: number;
  hitRate: number;
  totalCostSaved: number;
  averageResponseTime: number;
  oldestCacheEntry: string | null;
  newestCacheEntry: string | null;
}

export interface ClearCacheResponse {
  success: boolean;
  clearedCount: number;
}
