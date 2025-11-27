import { Router } from "express";
import { StockMoveLineController } from "../controllers/stockMoveLine.controller";
import { authMiddleware } from "../../../core/middleware/auth";

const router = Router();

// CRUD
router.get("/", authMiddleware(["WHSTAFF"]), StockMoveLineController.getAll);
router.get(
  "/:id",
  authMiddleware(["WHSTAFF"]),
  StockMoveLineController.getById
);
router.post("/", authMiddleware(["WHSTAFF"]), StockMoveLineController.create);
router.put("/:id", authMiddleware(["WHSTAFF"]), StockMoveLineController.update);
router.delete(
  "/:id",
  authMiddleware(["WHSTAFF"]),
  StockMoveLineController.delete
);

router.get(
  "/move/:moveId",
  authMiddleware(["WHSTAFF"]),
  StockMoveLineController.getByMoveId
);
router.delete(
  "/move/:moveId",
  authMiddleware(["WHSTAFF"]),
  StockMoveLineController.deleteByMoveId
);

router.post(
  "/bulk",
  authMiddleware(["WHSTAFF"]),
  StockMoveLineController.bulkCreate
);

export default router;
