import { Router, Request, Response } from "express";
import { NarrativeController } from "../controllers/narrative.controller";
import { NarrativeService } from "../services/narrative.service";
import { authMiddleware } from "../../../core/middleware/auth";
import { sequelize } from "../../../config/db";
import { initNarrativeConfigModel } from "../models/narrative-config.model";
import { initNarrativeCacheModel } from "../models/narrative-cache.model";
import { initNarrativeLogModel } from "../models/narrative-log.model";

// Init models với sequelize instance
initNarrativeConfigModel(sequelize);
initNarrativeCacheModel(sequelize);
initNarrativeLogModel(sequelize);

const router = Router();

// Initialize services and controller
const narrativeService = new NarrativeService(sequelize);
const controller = new NarrativeController(narrativeService);

// Middleware — authMiddleware là HOF, truyền [] để không restrict role
router.use(authMiddleware([]));

// Routes
router.post("/generate", (req: Request, res: Response) => {
  console.log("[AI-NARRATIVE] POST /generate called", req.body);
  controller.generateNarrative(req, res);
});

router.get("/logs", (req: Request, res: Response) =>
  controller.getNarrativeLogs(req, res),
);

router.get("/cache/stats", (req: Request, res: Response) =>
  controller.getCacheStats(req, res),
);

router.post("/cache/clear-expired", (req: Request, res: Response) =>
  controller.clearExpiredCache(req, res),
);

export default router;
