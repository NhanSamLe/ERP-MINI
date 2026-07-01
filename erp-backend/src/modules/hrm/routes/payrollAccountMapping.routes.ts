import { Router } from "express";
import { authMiddleware } from "../../../core/middleware/auth";
import {
  getMappingsHandler,
  createMappingHandler,
  updateMappingHandler,
  deleteMappingHandler,
} from "../controllers/payrollAccountMapping.controller";

const router = Router();

const hrmAndFinanceRoles = ["HRMANAGER", "HR_STAFF", "ACCOUNT", "CHACC", "ADMIN"];

router.get("/", authMiddleware(hrmAndFinanceRoles), getMappingsHandler);
router.post("/", authMiddleware(hrmAndFinanceRoles), createMappingHandler);
router.put("/:id", authMiddleware(hrmAndFinanceRoles), updateMappingHandler);
router.delete("/:id", authMiddleware(hrmAndFinanceRoles), deleteMappingHandler);

export default router;
