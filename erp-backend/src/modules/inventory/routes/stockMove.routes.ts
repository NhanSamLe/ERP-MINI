import { Router } from "express";
import { StockMoveController } from "../controllers/stockMove.controller";
import { authMiddleware } from "../../../core/middleware/auth";

const router = Router();

router.get("/", authMiddleware(["WHSTAFF"]), StockMoveController.getAll);
router.get("/:id", authMiddleware(["WHSTAFF"]), StockMoveController.getById);
router.post(
  "/receipt",
  authMiddleware(["WHSTAFF"]),
  StockMoveController.createReceiptStockMove
);

router.post(
  "/transfer",
  authMiddleware(["WHSTAFF"]),
  StockMoveController.createTransferStockMove
);

router.post(
  "/adjustment",
  authMiddleware(["WHSTAFF"]),
  StockMoveController.createAdjustmentStockMove
);

router.put(
  "/receipt/:id",
  authMiddleware(["WHSTAFF"]),
  StockMoveController.updateReceiptStockMove
);

router.put(
  "/transfer/:id",
  authMiddleware(["WHSTAFF"]),
  StockMoveController.updateTransferStockMove
);

router.put(
  "/adjustment/:id",
  authMiddleware(["WHSTAFF"]),
  StockMoveController.updateAdjustmentStockMove
);

router.delete(
  "/:id",
  authMiddleware(["WHSTAFF"]),
  StockMoveController.deleteStockMove
);

router.get(
  "/type/:type",
  authMiddleware(["WHSTAFF"]),
  StockMoveController.findByTypeStockMove
);
router.get(
  "/status/:status",
  authMiddleware(["WHSTAFF"]),
  StockMoveController.findByStatus
);

export default router;
