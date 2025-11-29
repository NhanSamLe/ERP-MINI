import { Router } from "express";
import { authMiddleware } from "../../../core/middleware/auth";
import {
  getPayrollRuns,
  getPayrollRunDetail,
  createPayrollRun,
  cancelPayrollRun,
  postPayrollRun,
  createPayrollRunLine,
  updatePayrollRunLine,
  deletePayrollRunLine,
  getMyPayslips,
  getMyPayslipInRun,
} from "../controllers/payrollRun.controller";

const router = Router();

// HR Staff + Accountant: xem bảng lương
router.get(
  "/",
  authMiddleware(["HR_STAFF", "ACCOUNT"]),
  getPayrollRuns
);
router.get(
  "/:id",
  authMiddleware(["HR_STAFF", "ACCOUNT"]),
  getPayrollRunDetail
);

// HR Staff: lập / hủy bảng lương
router.post("/", authMiddleware(["HR_STAFF"]), createPayrollRun);
router.delete("/:id", authMiddleware(["HR_STAFF"]), cancelPayrollRun);

// Accountant: post bảng lương
router.post("/:id/post", authMiddleware(["ACCOUNT"]), postPayrollRun);

// HR Staff: quản lý dòng lương
router.post("/:id/lines", authMiddleware(["HR_STAFF"]), createPayrollRunLine);
router.put(
  "/lines/:lineId",
  authMiddleware(["HR_STAFF"]),
  updatePayrollRunLine
);
router.delete(
  "/lines/:lineId",
  authMiddleware(["HR_STAFF"]),
  deletePayrollRunLine
);

// Employee: xem phiếu lương cá nhân
router.get("/me/payslips", authMiddleware([]), getMyPayslips);
router.get("/:id/my-payslip", authMiddleware([]), getMyPayslipInRun);

export default router;
