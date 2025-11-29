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
  authMiddleware(["HR_STAFF" ]),
  getPayrollItems
);
router.get(
  "/:id",
  authMiddleware(["HR_STAFF" ]),
  getPayrollItemDetail
);

// HR_STAFF: CRUD
router.post("/", authMiddleware(["HR_STAFF"]), createPayrollItem);
router.put("/:id", authMiddleware(["HR_STAFF"]), updatePayrollItem);
router.delete("/:id", authMiddleware(["HR_STAFF"]), deletePayrollItem);

export default router;
