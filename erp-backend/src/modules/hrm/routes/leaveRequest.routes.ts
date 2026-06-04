import { Router } from "express";
import * as ctrl from "../controllers/leaveRequest.controller";
import { authMiddleware } from "../../../core/middleware/auth";

const router = Router();

// 👉 Quản lý/HR: xem danh sách đơn nghỉ phép
router.get(
  "/",
  authMiddleware(["HRMANAGER", "HR_STAFF", "CEO", "BRANCH_MANAGER", "ADMIN"]),
  ctrl.getAll
);

// 👉 Tất cả user: xem danh sách đơn của mình
router.get("/employee/:employeeId", authMiddleware([]), ctrl.getByEmployee);

// 👉 Tất cả user: gửi đơn xin nghỉ phép
router.post("/", authMiddleware([]), ctrl.create);

// 👉 Quản lý/HR: duyệt đơn
router.post(
  "/:id/approve",
  authMiddleware(["HRMANAGER", "HR_STAFF", "ADMIN"]),
  ctrl.approve
);

// 👉 Quản lý/HR: từ chối đơn
router.post(
  "/:id/reject",
  authMiddleware(["HRMANAGER", "HR_STAFF", "ADMIN"]),
  ctrl.reject
);

export default router;
