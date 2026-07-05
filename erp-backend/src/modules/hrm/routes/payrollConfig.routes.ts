import { Router } from "express";
import * as payrollConfigController from "../controllers/payrollConfig.controller";
import { authMiddleware } from "../../../core/middleware/auth";

const router = Router();

router.get("/", authMiddleware(["ACCOUNT", "CHACC", "ADMIN", "CEO", "HRMANAGER", "HR_STAFF"]), payrollConfigController.getConfigs);
router.post("/", authMiddleware(["HRMANAGER", "HR_STAFF", "CHACC", "ADMIN"]), payrollConfigController.updateConfigs);

export default router;
