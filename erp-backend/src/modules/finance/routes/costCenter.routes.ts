import { Router } from "express";
import { authMiddleware } from "../../../core/middleware/auth";
import {
  getCostCentersHandler,
  getCostCenterByIdHandler,
  createCostCenterHandler,
  updateCostCenterHandler,
  deleteCostCenterHandler,
} from "../controllers/costCenter.controller";

const router = Router();

const hrmAndFinanceRoles = ["HRMANAGER", "HR_STAFF", "ACCOUNT", "CHACC", "ADMIN"];

router.get("/", authMiddleware(hrmAndFinanceRoles), getCostCentersHandler);
router.get("/:id", authMiddleware(hrmAndFinanceRoles), getCostCenterByIdHandler);
router.post("/", authMiddleware(hrmAndFinanceRoles), createCostCenterHandler);
router.put("/:id", authMiddleware(hrmAndFinanceRoles), updateCostCenterHandler);
router.delete("/:id", authMiddleware(hrmAndFinanceRoles), deleteCostCenterHandler);

export default router;
