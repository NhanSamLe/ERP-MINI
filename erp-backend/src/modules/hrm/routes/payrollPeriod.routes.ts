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
  authMiddleware(["HR_STAFF", "CHACC"]),
  getPayrollPeriods
);

router.get(
  "/:id",
  authMiddleware(["HR_STAFF", "CHACC"]),
  getPayrollPeriodDetail
);

// Chỉ HR Staff mới được tạo / sửa / đóng / xóa
router.post("/", authMiddleware(["HR_STAFF"]), createPayrollPeriod);
router.put("/:id", authMiddleware(["HR_STAFF"]), updatePayrollPeriod);
router.post("/:id/close", authMiddleware(["HR_STAFF"]), closePayrollPeriod);
router.delete("/:id", authMiddleware(["HR_STAFF"]), deletePayrollPeriod);

export default router;
