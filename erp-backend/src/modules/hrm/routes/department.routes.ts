import { Router } from "express";
import {
  getDepartmentsHandler,
  getDepartmentByIdHandler,
  createDepartmentHandler,
  updateDepartmentHandler,
  toggleDepartmentStatusHandler,
} from "../controllers/department.controller";

const router = Router();

router.get("/", getDepartmentsHandler);
router.get("/:id", getDepartmentByIdHandler);
router.post("/", createDepartmentHandler);
router.put("/:id", updateDepartmentHandler);
router.patch("/:id/status", toggleDepartmentStatusHandler);

export default router;
