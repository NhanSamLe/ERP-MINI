import { Router } from "express";
import { authMiddleware } from "../../../core/middleware/auth";
import {
  getAccountMappingsHandler,
  upsertAccountMappingHandler,
  deleteAccountMappingHandler,
} from "../controllers/accountMapping.controller";

const router = Router();

const financeRoles = ["ACCOUNT", "CHACC", "ADMIN"];

router.get("/", authMiddleware(financeRoles), getAccountMappingsHandler);
router.post("/", authMiddleware(financeRoles), upsertAccountMappingHandler);
router.delete("/:id", authMiddleware(financeRoles), deleteAccountMappingHandler);

export default router;
