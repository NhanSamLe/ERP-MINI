import { Router } from "express";
import * as fiscalPeriodController from "../controllers/fiscalPeriod.controller";
import { authMiddleware } from "../../../core/middleware/auth";

const router = Router();

router.get("/", authMiddleware(["ACCOUNT", "CHACC", "ADMIN", "CEO"]), fiscalPeriodController.listPeriods);
router.post("/:id/close", authMiddleware(["CHACC", "ADMIN"]), fiscalPeriodController.closePeriod);
router.post("/:id/open", authMiddleware(["CHACC", "ADMIN"]), fiscalPeriodController.openPeriod);
router.post("/close-branch", authMiddleware(["CHACC", "ADMIN"]), fiscalPeriodController.closeBranchPeriodController);

export default router;
