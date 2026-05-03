import { Request, Response } from "express";
import { NarrativeService } from "../services/narrative.service";
import { GenerateNarrativeRequest } from "../types";

export class NarrativeController {
  constructor(private narrativeService: NarrativeService) {}

  /**
   * Generate narrative
   */
  async generateNarrative(req: Request, res: Response): Promise<void> {
    try {
      const request: GenerateNarrativeRequest = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const result = await this.narrativeService.generateNarrative(
        request,
        userId,
      );

      if (!result.success) {
        console.error("[NARRATIVE] Generate failed:", result.error);
        res.status(500).json({ error: result.error });
        return;
      }

      res.json(result);
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: (error as any).message });
    }
  }

  /**
   * Get narrative logs
   */
  async getNarrativeLogs(req: Request, res: Response): Promise<void> {
    try {
      const companyId = parseInt(req.query.companyId as string);
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      if (!companyId) {
        res.status(400).json({ error: "companyId is required" });
        return;
      }

      const result = await this.narrativeService.getNarrativeLogs(
        companyId,
        limit,
        offset,
      );

      res.json(result);
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: (error as any).message });
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(req: Request, res: Response): Promise<void> {
    try {
      const companyId = parseInt(req.query.companyId as string);

      if (!companyId) {
        res.status(400).json({ error: "companyId is required" });
        return;
      }

      const result = await this.narrativeService.getCacheStats(companyId);

      res.json(result);
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: (error as any).message });
    }
  }

  /**
   * Clear expired cache
   */
  async clearExpiredCache(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.narrativeService.clearExpiredCache();

      res.json(result);
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: (error as any).message });
    }
  }
}
