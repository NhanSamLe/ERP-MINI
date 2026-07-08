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

router.get(
  "/search",
  authMiddleware([Role.WHSTAFF, Role.WHMANAGER]),
  StockMoveController.search
);

router.post(
  "/:id/approve",
  authMiddleware([Role.WHMANAGER]),
  StockMoveController.approve
);

router.post(
  "/:id/sign",
  authMiddleware([Role.WHMANAGER]),
  StockMoveController.signStockMove
);

router.put(
  "/:id/reject",
  authMiddleware([Role.WHMANAGER]),
  StockMoveController.reject
);

router.post(
  "/receipt",
  authMiddleware([Role.WHSTAFF, Role.WHMANAGER]),
  StockMoveController.createReceiptStockMove
);

router.post(
  "/issue",
  authMiddleware([Role.WHSTAFF, Role.WHMANAGER]),
  StockMoveController.createIssuetStockMove
);

router.post(
  "/purchase-return/:returnId/issue",
  authMiddleware([Role.WHSTAFF, Role.WHMANAGER]),
  StockMoveController.createPurchaseReturnIssue
);

router.post(
  "/transfer",
  authMiddleware([Role.WHSTAFF, Role.WHMANAGER]),
  StockMoveController.createTransferStockMove
);

router.post(
  "/adjustment",
  authMiddleware([Role.WHSTAFF, Role.WHMANAGER]),
  StockMoveController.createAdjustmentStockMove
);

router.put(
  "/receipt/:id",
  authMiddleware([Role.WHSTAFF, Role.WHMANAGER]),
  StockMoveController.updateReceiptStockMove
);

router.put(
  "/issue/:id",
  authMiddleware([Role.WHSTAFF, Role.WHMANAGER]),
  StockMoveController.updateIssueStockMove
);

router.put(
  "/transfer/:id",
  authMiddleware([Role.WHSTAFF, Role.WHMANAGER]),
  StockMoveController.updateTransferStockMove
);

router.put(
  "/adjustment/:id",
  authMiddleware([Role.WHSTAFF, Role.WHMANAGER]),
  StockMoveController.updateAdjustmentStockMove
);

router.delete(
  "/:id",
  authMiddleware([Role.WHSTAFF, Role.WHMANAGER]),
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
  authMiddleware([Role.WHSTAFF, Role.WHMANAGER]),
  StockMoveController.submitForApproval
);

router.get(
  "/:id",
  authMiddleware([Role.WHSTAFF, Role.WHMANAGER]),
  StockMoveController.getById
);
router.post(
  "/:id/receive",
  authMiddleware([Role.WHMANAGER, Role.WHSTAFF]),
  StockMoveController.receiveTransfer
);

export default router;
