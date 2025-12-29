import { Router } from "express";
import { ReportController } from "./controllers/report.controller";

const router = Router();

router.get("/sales", ReportController.getSalesSummary);
router.get("/purchase", ReportController.getPurchaseSummary);

export const reportRoutes = router;
