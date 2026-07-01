import { Router } from "express";
import {
  getPayrollItems,
  getPayrollItemDetail,
  createPayrollItem,
  updatePayrollItem,
  deletePayrollItem,
} from "../controllers/payrollItem.controller";
import { authMiddleware } from "../../../core/middleware/auth";

const router = Router();

// HR_STAFF + CHIEF_ACCOUNTANT: chỉ xem
router.get(
  "/",
  authMiddleware(["HR_STAFF", "HRMANAGER","ACCOUNT" ]),
  getPayrollItems
);
router.get(
  "/:id",
  authMiddleware(["HR_STAFF", "HRMANAGER","ACCOUNT"  ]),
  getPayrollItemDetail
);

// HR_STAFF: CRUD
router.post("/", authMiddleware(["HR_STAFF", "HRMANAGER","ACCOUNT"]), createPayrollItem);
router.put("/:id", authMiddleware(["HR_STAFF", "HRMANAGER","ACCOUNT"]), updatePayrollItem);
router.delete("/:id", authMiddleware(["HR_STAFF", "HRMANAGER","ACCOUNT"]), deletePayrollItem);

export default router;
