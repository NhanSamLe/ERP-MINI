import { Router } from "express";
import * as branchController from "./controllers/branch.controller";
import { authMiddleware } from "../../core/middleware/auth";

const router = Router();

// Tất cả route chi nhánh cần đăng nhập: controller dùng req.user.company_id để
// scope dữ liệu theo công ty. Thiếu authMiddleware → req.user undefined →
// createBranch luôn trả 400 "User không có company_id".
router.get("/",  authMiddleware([]), branchController.getAllBranches);
router.get("/:id", authMiddleware([]), branchController.getBranch);
router.post("/", authMiddleware([]), branchController.createBranch);
router.put("/:id", authMiddleware([]), branchController.updateBranch);
router.patch("/:id/deactivate", authMiddleware([]), branchController.deactivateBranch);
router.patch("/:id/activate",   authMiddleware([]), branchController.activateBranch);
// (tuỳ chọn) xóa cứng: sẽ chặn khi còn dữ liệu liên quan
router.delete("/:id", authMiddleware([]), branchController.deleteBranch);


export default router;
