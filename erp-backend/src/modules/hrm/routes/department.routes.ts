import { Router } from "express";
import { authMiddleware } from "../../../core/middleware/auth";
import {
  getDepartmentsHandler,
  getDepartmentByIdHandler,
  createDepartmentHandler,
  updateDepartmentHandler,
  toggleDepartmentStatusHandler,
} from "../controllers/department.controller";

const router = Router();

const readRoles = authMiddleware([]);
const writeRoles = authMiddleware(["HRMANAGER", "HR_STAFF"]);

router.get("/", readRoles, getDepartmentsHandler);
router.get("/:id", readRoles, getDepartmentByIdHandler);
router.post("/", writeRoles, createDepartmentHandler);
router.put("/:id", writeRoles, updateDepartmentHandler);
router.patch("/:id/status", writeRoles, toggleDepartmentStatusHandler);

export default router;
