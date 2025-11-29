import { Router } from "express";
import {
  getPayrollPeriods,
  getPayrollPeriodDetail,
  createPayrollPeriod,
  updatePayrollPeriod,
  closePayrollPeriod,
  deletePayrollPeriod,  
} from "../controllers/payrollPeriod.controller";

const router = Router();

// TODO: gắn middleware auth + check role HR Staff / Chief Accountant
// ví dụ: router.use(authMiddleware);

// HR Staff & Chief Accountant – xem danh sách / chi tiết kỳ lương
router.get("/", getPayrollPeriods);
router.get("/:id", getPayrollPeriodDetail);

// HR Staff – tạo & cập nhật kỳ lương
router.post("/", createPayrollPeriod);
router.put("/:id", updatePayrollPeriod);

// HR Staff – đóng kỳ lương
router.post("/:id/close", closePayrollPeriod);
router.delete("/:id", deletePayrollPeriod);

export default router;
