import { Router } from "express";
import { authMiddleware } from "../../../core/middleware/auth";
import {
  listPositions,
  getPosition,
  createPositionHandler,
  updatePositionHandler,
  togglePositionStatusHandler,
} from "../controllers/position.controller";

const router = Router();

const readRoles = authMiddleware([]);
const writeRoles = authMiddleware(["HRMANAGER", "HR_STAFF"]);

router.get("/", readRoles, listPositions);
router.get("/:id", readRoles, getPosition);
router.post("/", writeRoles, createPositionHandler);
router.put("/:id", writeRoles, updatePositionHandler);
router.patch("/:id/status", writeRoles, togglePositionStatusHandler);

export default router;
