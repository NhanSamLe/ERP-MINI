import { Router } from "express";
import * as branchController from "./controllers/branch.controller";
import { authMiddleware } from "../../core/middleware/auth";

const router = Router();

router.get("/", authMiddleware, branchController.getAllBranches);

export default router;
