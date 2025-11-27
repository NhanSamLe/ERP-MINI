import { Router } from "express";
import { getOrganizationChart } from "../controllers/organization.controller";
import { authMiddleware } from "../../../core/middleware/auth";

const router = Router();

router.get("/:branchId", authMiddleware(["CEO", "BRANCH_MANAGER"]), getOrganizationChart);

export default router;
