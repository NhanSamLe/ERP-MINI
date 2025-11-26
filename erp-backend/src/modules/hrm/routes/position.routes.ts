import { Router } from "express";
import {
  listPositions,
  getPosition,
  createPositionHandler,
  updatePositionHandler,
  deletePositionHandler,
} from "../controllers/position.controller";

const router = Router();

router.get("/", listPositions);
router.get("/:id", getPosition);
router.post("/", createPositionHandler);
router.put("/:id", updatePositionHandler);
router.delete("/:id", deletePositionHandler);


export default router;
