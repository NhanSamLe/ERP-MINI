import axiosClient from "@/api/axiosClient";
import { GenerateNarrativeRequest } from "../types/narrative.types";

export const generateNarrativeApi = (data: GenerateNarrativeRequest) =>
  axiosClient.post("/ai-narrative/generate", data);

export const getNarrativeLogsApi = (
  companyId: number,
  limit = 20,
  offset = 0,
) =>
  axiosClient.get("/ai-narrative/logs", {
    params: { companyId, limit, offset },
  });

export const getCacheStatsApi = (companyId: number) =>
  axiosClient.get("/ai-narrative/cache/stats", { params: { companyId } });

export const clearExpiredCacheApi = () =>
  axiosClient.post("/ai-narrative/cache/clear-expired");
