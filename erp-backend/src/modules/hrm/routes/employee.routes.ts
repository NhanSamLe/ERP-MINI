import { Router } from "express";
import { authMiddleware } from "../../../core/middleware/auth";
import {
  listEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  resignEmployee,
  getOwnProfile,
  registerFace,
} from "../controllers/employee.controller";

const router = Router();

router.get("/me/profile", authMiddleware([]), getOwnProfile);
router.get("/", authMiddleware(["HR_STAFF", "HRMANAGER", "CEO", "BRANCH_MANAGER"]), listEmployees);
router.get("/:id", authMiddleware(["HR_STAFF", "HRMANAGER", "CEO", "BRANCH_MANAGER"]), getEmployee);
router.post("/", authMiddleware(["HR_STAFF", "HRMANAGER"]), createEmployee);
router.put("/:id", authMiddleware(["HR_STAFF", "HRMANAGER"]), updateEmployee);
router.delete("/:id", authMiddleware(["HR_STAFF", "HRMANAGER"]), deleteEmployee);

// Offboarding: POST /hrm/employees/:id/resign
router.post("/:id/resign", authMiddleware(["HR_STAFF", "HRMANAGER"]), resignEmployee);

router.post("/:id/register-face", authMiddleware(["HR_STAFF", "HRMANAGER"]), registerFace);

export default router;
