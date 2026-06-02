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

router.get("/", authMiddleware(["HR_STAFF", "CEO", "BRANCH_MANAGER"]), listEmployees);
router.get("/:id", authMiddleware(["HR_STAFF", "CEO", "BRANCH_MANAGER"]), getEmployee);
router.post("/", authMiddleware(["HR_STAFF"]), createEmployee);
router.put("/:id", authMiddleware(["HR_STAFF"]), updateEmployee);
router.delete("/:id", authMiddleware(["HR_STAFF"]), deleteEmployee);

// Offboarding: POST /hrm/employees/:id/resign
router.post("/:id/resign", authMiddleware(["HR_STAFF"]), resignEmployee);

router.post("/:id/register-face", authMiddleware(["HR_STAFF"]), registerFace);

router.get("/me/profile", authMiddleware([]), getOwnProfile);

export default router;
