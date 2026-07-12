import { Router } from "express";
import * as ctrl from "../controllers/attendance.controller";
import { authMiddleware } from "../../../core/middleware/auth";

const router = Router();

// 👉 HR_STAFF: xem & quản lý toàn bộ chấm công
router.get("/", authMiddleware(["HR_STAFF", "HRMANAGER"]), ctrl.getAll); 

// 👉 tất cả user đã đăng nhập đều xem được chấm công của 1 employee (FE sẽ dùng employeeId của chính họ)
// (nếu muốn bảo mật chặt hơn thì sau này sửa lại theo userJwt.id ↔ employee_id)
router.get("/employee/:employeeId", authMiddleware([]), ctrl.getByEmployee); 

// 👉 HR_STAFF: tạo / sửa / xóa
router.post("/", authMiddleware(["HR_STAFF", "HRMANAGER"]), ctrl.create); 
router.post("/holiday", authMiddleware(["HR_STAFF", "HRMANAGER"]), ctrl.createHolidayBulk);
router.put("/:id", authMiddleware(["HR_STAFF", "HRMANAGER"]), ctrl.update); 
router.delete("/:id", authMiddleware(["HR_STAFF", "HRMANAGER"]), ctrl.remove); 

// 👉 Chấm công AI bằng Kiosk (Công khai)
router.post("/check-in-ai", ctrl.checkInAI);

export default router;
