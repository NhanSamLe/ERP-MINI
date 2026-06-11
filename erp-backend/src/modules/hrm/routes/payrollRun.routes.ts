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
  getPayrollEvidence
} from "../controllers/payrollRun.controller";

const router = Router();

router.get("/me/payslips", authMiddleware([]), getMyPayslips);
router.get("/:id/my-payslip", authMiddleware([]), getMyPayslipInRun);

// HR Staff + Accountant: xem bảng lương
router.get(
  "/",
  authMiddleware(["HR_STAFF", "HRMANAGER", "ACCOUNT"]),
  getPayrollRuns
);
router.get(
  "/:id",
  authMiddleware(["HR_STAFF", "HRMANAGER", "ACCOUNT"]),
  getPayrollRunDetail
);

// HR Staff: lập / hủy bảng lương
router.post("/", authMiddleware(["HR_STAFF", "HRMANAGER"]), createPayrollRun);
router.delete("/:id", authMiddleware(["HR_STAFF", "HRMANAGER"]), cancelPayrollRun);

// ✅ calculate
router.post("/:id/calculate", authMiddleware(["HR_STAFF", "HRMANAGER"]), calculateRun);

// Accountant: post bảng lương
router.post("/:id/post", authMiddleware(["ACCOUNT"]), postPayrollRun);
router.get(
  "/:runId/evidence/:employeeId",
  authMiddleware(["HR_STAFF", "HRMANAGER", "ACCOUNT"]),
  getPayrollEvidence
);


// HR Staff: quản lý dòng lương
router.post("/:id/lines", authMiddleware(["HR_STAFF", "HRMANAGER"]), createPayrollRunLine);
router.put(
  "/lines/:lineId",
  authMiddleware(["HR_STAFF", "HRMANAGER"]),
  updatePayrollRunLine
);
router.delete(
  "/lines/:lineId",
  authMiddleware(["HR_STAFF", "HRMANAGER"]),
  deletePayrollRunLine
);




export default router;
