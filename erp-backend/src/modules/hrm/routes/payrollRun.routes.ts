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
  getPayrollEvidence,
  submitPayrollRun,
  approvePayrollRun,
  rejectPayrollRun,
  getPayslipPdf,
  sendPayslipsEmail,
  getPayrollRunPdf
} from "../controllers/payrollRun.controller";

const router = Router();

router.get("/me/payslips", authMiddleware([]), getMyPayslips);
router.get("/:id/my-payslip", authMiddleware([]), getMyPayslipInRun);
router.get("/lines/:id/pdf", authMiddleware([]), getPayslipPdf);
router.get("/:id/pdf", authMiddleware(["HR_STAFF", "HRMANAGER", "ACCOUNT", "CHACC", "CEO", "ADMIN"]), getPayrollRunPdf);
router.post("/:id/send-emails", authMiddleware(["HR_STAFF", "HRMANAGER", "ADMIN"]), sendPayslipsEmail);

// HR Staff + Accountant: xem bảng lương
router.get(
  "/",
  authMiddleware(["HR_STAFF", "ACCOUNT", "CHACC", "CEO", "HRMANAGER"]),
  getPayrollRuns
);
router.get(
  "/:id",
  authMiddleware(["HR_STAFF", "ACCOUNT", "CHACC", "CEO", "HRMANAGER"]),
  getPayrollRunDetail
);

// HR Staff + Accountant: lập / hủy bảng lương
router.post("/", authMiddleware(["HR_STAFF", "ACCOUNT", "CHACC"]), createPayrollRun);
router.delete("/:id", authMiddleware(["HR_STAFF", "ACCOUNT", "CHACC"]), cancelPayrollRun);

// ✅ calculate
router.post("/:id/calculate", authMiddleware(["HR_STAFF", "ACCOUNT", "CHACC"]), calculateRun);

// Accountant: post bảng lương (legacy direct post)
router.post("/:id/post", authMiddleware(["ACCOUNT", "CHACC"]), postPayrollRun);

// Multi-level approvals
router.post("/:id/submit", authMiddleware(["HR_STAFF", "ACCOUNT", "CHACC"]), submitPayrollRun);
router.post("/:id/approve", authMiddleware(["CHACC", "CEO"]), approvePayrollRun);
router.post("/:id/reject", authMiddleware(["CHACC", "CEO"]), rejectPayrollRun);

router.get(
  "/:runId/evidence/:employeeId",
  authMiddleware([]),
  getPayrollEvidence
);

// HR Staff + Accountant: quản lý dòng lương
router.post("/:id/lines", authMiddleware(["HR_STAFF", "ACCOUNT", "CHACC"]), createPayrollRunLine);
router.put(
  "/lines/:lineId",
  authMiddleware(["HR_STAFF", "ACCOUNT", "CHACC"]),
  updatePayrollRunLine
);
router.delete(
  "/lines/:lineId",
  authMiddleware(["HR_STAFF", "ACCOUNT", "CHACC"]),
  deletePayrollRunLine
);

export default router;
