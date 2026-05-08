import { Router } from "express";
import {
  listPositions,
  getPosition,
  createPositionHandler,
  updatePositionHandler,
  togglePositionStatusHandler,
} from "../controllers/position.controller";

const router = Router();

router.get("/", listPositions);
router.get("/:id", getPosition);
router.post("/", createPositionHandler);
router.put("/:id", updatePositionHandler);
router.patch("/:id/status", togglePositionStatusHandler);

export default router;
