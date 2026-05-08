import * as api from "../api/narrative.api";
import {
  GenerateNarrativeRequest,
  GenerateNarrativeResponse,
  NarrativeLogsResponse,
  CacheStats,
  ClearCacheResponse,
} from "../types/narrative.types";

export async function generateNarrative(
  data: GenerateNarrativeRequest,
): Promise<GenerateNarrativeResponse> {
  const res = await api.generateNarrativeApi(data);
  const body = res.data as any;
  // Backend: { success, data: NarrativeOutput, cacheHit }
  // Frontend expects: { success, cacheHit, narrative, tokensUsed, costUSD, ... }
  return {
    success: body.success,
    cacheHit: body.cacheHit ?? false,
    narrative: body.data?.narrative ?? "",
    tokensUsed: body.data?.metadata?.tokensUsed ?? 0,
    costUSD: body.data?.metadata
      ? body.data.metadata.tokensUsed * 0.00000015
      : 0,
    generatedAt: body.data?.generatedAt ?? new Date().toISOString(),
    error: body.error,
  };
}

export async function getNarrativeLogs(
  companyId: number,
  limit?: number,
  offset?: number,
): Promise<NarrativeLogsResponse> {
  const res = await api.getNarrativeLogsApi(companyId, limit, offset);
  // Backend trả về { success, data: [...], total }
  const body = res.data as any;
  return {
    logs: body.data ?? [],
    total: body.total ?? 0,
  };
}

export async function getCacheStats(companyId: number): Promise<CacheStats> {
  const res = await api.getCacheStatsApi(companyId);
  // Backend trả về { success, data: { totalCached, ... } }
  const body = res.data as any;
  const d = body.data ?? body;
  return {
    totalCached: d.totalCached ?? 0,
    cacheHits: d.cacheHits ?? 0,
    cacheMisses: d.cacheMisses ?? 0,
    hitRate: d.cacheHitRate ?? d.hitRate ?? 0,
    totalCostSaved: d.totalCostSaved ?? 0,
    averageResponseTime: d.averageResponseTime ?? 0,
    oldestCacheEntry: d.oldestCacheEntry ?? null,
    newestCacheEntry: d.newestCacheEntry ?? null,
  };
}

export async function clearExpiredCache(): Promise<ClearCacheResponse> {
  const res = await api.clearExpiredCacheApi();
  const body = res.data as any;
  return {
    success: body.success ?? true,
    clearedCount: body.data?.deletedCount ?? body.clearedCount ?? 0,
  };
}
