import { Router } from "express";
import { agentAdminController } from "./agentAdmin.controller";
import { authMiddleware } from "../../core/middleware/auth";
import { Role } from "../../core/types/enum";

const router = Router();

// Chỉ ADMIN mới được trigger agents thủ công
const adminOnly = authMiddleware([Role.ADMIN]);

router.post("/run/inventory", adminOnly, agentAdminController.runInventory);
router.post("/run/overdue-po", adminOnly, agentAdminController.runOverduePo);
router.post("/run/invoice-due", adminOnly, agentAdminController.runInvoiceDue);
router.post("/run/all", adminOnly, agentAdminController.runAll);

export default router;
