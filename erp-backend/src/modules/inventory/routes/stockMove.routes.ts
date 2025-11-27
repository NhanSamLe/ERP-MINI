import { Router } from "express";
import { StockMoveController } from "../controllers/stockMove.controller";
import { authMiddleware } from "../../../core/middleware/auth";

const router = Router();

router.get("/", authMiddleware(["WHSTAFF"]), StockMoveController.getAll);
router.get("/:id", authMiddleware(["WHSTAFF"]), StockMoveController.getById);
router.post(
  "/",
  authMiddleware(["WHSTAFF"]),
  StockMoveController.createStockMove
);
router.put(
  "/:id",
  authMiddleware(["WHSTAFF"]),
  StockMoveController.updateStockMove
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
  "/warehouse/:warehouseId",
  authMiddleware(["WHSTAFF"]),
  StockMoveController.findByWarehouse
);
router.get(
  "/status/:status",
  authMiddleware(["WHSTAFF"]),
  StockMoveController.findByStatus
);

export default router;
