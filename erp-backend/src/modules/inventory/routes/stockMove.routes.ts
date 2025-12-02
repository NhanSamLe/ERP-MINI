import { Router } from "express";
import { StockMoveController } from "../controllers/stockMove.controller";
import { authMiddleware } from "../../../core/middleware/auth";
import { Role } from "../../../core/types/enum";

const router = Router();

router.get(
  "/",
  authMiddleware([Role.WHSTAFF, Role.WHMANAGER]),
  StockMoveController.getAll
);

router.post(
  "/:id/approve",
  authMiddleware([Role.WHMANAGER]),
  StockMoveController.approve
);

router.put(
  "/:id/reject",
  authMiddleware([Role.WHMANAGER]),
  StockMoveController.reject
);

router.get(
  "/:id",
  authMiddleware([Role.WHSTAFF, Role.WHMANAGER]),
  StockMoveController.getById
);
router.post(
  "/receipt",
  authMiddleware([Role.WHSTAFF]),
  StockMoveController.createReceiptStockMove
);

router.post(
  "/issue",
  authMiddleware([Role.WHSTAFF]),
  StockMoveController.createIssuetStockMove
);

router.post(
  "/transfer",
  authMiddleware([Role.WHSTAFF]),
  StockMoveController.createTransferStockMove
);

router.post(
  "/adjustment",
  authMiddleware([Role.WHSTAFF]),
  StockMoveController.createAdjustmentStockMove
);

router.put(
  "/receipt/:id",
  authMiddleware([Role.WHSTAFF]),
  StockMoveController.updateReceiptStockMove
);

router.put(
  "/issue/:id",
  authMiddleware([Role.WHSTAFF]),
  StockMoveController.updateIssueStockMove
);

router.put(
  "/transfer/:id",
  authMiddleware([Role.WHSTAFF]),
  StockMoveController.updateTransferStockMove
);

router.put(
  "/adjustment/:id",
  authMiddleware([Role.WHSTAFF]),
  StockMoveController.updateAdjustmentStockMove
);

router.delete(
  "/:id",
  authMiddleware([Role.WHSTAFF]),
  StockMoveController.deleteStockMove
);

router.get(
  "/type/:type",
  authMiddleware([Role.WHSTAFF, Role.WHMANAGER]),
  StockMoveController.findByTypeStockMove
);
router.get(
  "/status/:status",
  authMiddleware([Role.WHSTAFF, Role.WHMANAGER]),
  StockMoveController.findByStatus
);

router.post(
  "/:id/submit",
  authMiddleware([Role.WHSTAFF]),
  StockMoveController.submitForApproval
);

export default router;
