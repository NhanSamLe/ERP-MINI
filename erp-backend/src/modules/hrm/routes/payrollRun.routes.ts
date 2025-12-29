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
  calculateRun,  
} from "../controllers/payrollRun.controller";

const router = Router();

router.get("/me/payslips", authMiddleware([]), getMyPayslips);
router.get("/:id/my-payslip", authMiddleware([]), getMyPayslipInRun);

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

// ✅ calculate
router.post("/:id/calculate", authMiddleware(["HR_STAFF"]), calculateRun);

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




export default router;
