import { Router } from "express";
import {
  getDepartmentsHandler,
  getDepartmentByIdHandler,
  createDepartmentHandler,
  updateDepartmentHandler,
  deleteDepartmentHandler,
} from "../controllers/department.controller";


const router = Router();

router.get("/", getDepartmentsHandler);
router.get("/:id", getDepartmentByIdHandler);
router.post("/", createDepartmentHandler);
router.put("/:id", updateDepartmentHandler);
router.delete("/:id", deleteDepartmentHandler);

export default router;
