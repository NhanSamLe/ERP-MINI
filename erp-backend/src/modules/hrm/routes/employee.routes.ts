import { Router } from "express";
import { authMiddleware } from "../../../core/middleware/auth";
import {
  listEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getOwnProfile,
} from "../controllers/employee.controller";

const router = Router();

// HR Staff: CRUD Employee
router.get(
  "/",
  authMiddleware(["HR_STAFF", "CEO", "BRANCH_MANAGER"]),
  listEmployees
);
router.get("/:id", authMiddleware(["HR_STAFF", "CEO", "BRANCH_MANAGER"]), getEmployee);
router.post("/", authMiddleware(["HR_STAFF"]), createEmployee);
router.put("/:id", authMiddleware(["HR_STAFF"]), updateEmployee);
router.delete("/:id", authMiddleware(["HR_STAFF"]), deleteEmployee);

// Employee (bất kỳ user login) xem profile của chính mình
router.get("/me/profile", authMiddleware([]), getOwnProfile);

export default router;
