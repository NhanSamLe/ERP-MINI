import { Router } from "express";
import { StockMoveController } from "../controllers/stockMove.controller";
import { authMiddleware } from "../../../core/middleware/auth";

const router = Router();

router.get("/", authMiddleware(["WHSTAFF"]), StockMoveController.getAll);
router.get("/:id", authMiddleware(["WHSTAFF"]), StockMoveController.getById);
router.post("/", authMiddleware(["WHSTAFF"]), StockMoveController.create);
router.put("/:id", authMiddleware(["WHSTAFF"]), StockMoveController.update);
router.delete("/:id", authMiddleware(["WHSTAFF"]), StockMoveController.delete);

router.get(
  "/type/:type",
  authMiddleware(["WHSTAFF"]),
  StockMoveController.findByType
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
