import { Router } from "express";
import {
  getPayrollPeriods,
  getPayrollPeriodDetail,
  createPayrollPeriod,
  updatePayrollPeriod,
  closePayrollPeriod,
  deletePayrollPeriod,
} from "../controllers/payrollPeriod.controller";
import { authMiddleware } from "../../../core/middleware/auth";

const router = Router();

// HR Staff + Chief Accountant: được xem
router.get(
  "/",
  authMiddleware(["HR_STAFF", "HRMANAGER", "CHACC"]),
  getPayrollPeriods
);

router.get(
  "/:id",
  authMiddleware(["HR_STAFF", "HRMANAGER", "CHACC"]),
  getPayrollPeriodDetail
);

// Chỉ HR Staff mới được tạo / sửa / đóng / xóa
router.post("/", authMiddleware(["HR_STAFF", "HRMANAGER"]), createPayrollPeriod);
router.put("/:id", authMiddleware(["HR_STAFF", "HRMANAGER"]), updatePayrollPeriod);
router.post("/:id/close", authMiddleware(["HR_STAFF", "HRMANAGER"]), closePayrollPeriod);
router.delete("/:id", authMiddleware(["HR_STAFF", "HRMANAGER"]), deletePayrollPeriod);

export default router;
