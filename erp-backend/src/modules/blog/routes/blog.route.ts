import { Router } from "express";
import { blogController } from "../controllers/blog.controller";
import { authMiddleware } from "../../../core/middleware/auth";

const router = Router();

// Xem danh sách và chi tiết bài viết (Công khai)
router.get("/", blogController.getList.bind(blogController));
router.get("/:idOrSlug", blogController.getDetail.bind(blogController));

// Tạo, chỉnh sửa, xóa và sinh bài viết AI
router.post("/", authMiddleware(["ADMIN", "CEO", "SALESMANAGER", "SALES"]), blogController.create.bind(blogController));
router.put("/:id", authMiddleware(["ADMIN", "CEO", "SALESMANAGER", "SALES"]), blogController.update.bind(blogController));
router.delete("/:id", authMiddleware(["ADMIN", "CEO", "SALESMANAGER"]), blogController.delete.bind(blogController));
router.post("/generate", authMiddleware(["ADMIN", "CEO", "SALESMANAGER", "SALES"]), blogController.generatePR.bind(blogController));
router.post("/generate/stream", authMiddleware(["ADMIN", "CEO", "SALESMANAGER", "SALES"]), blogController.generatePRStream.bind(blogController));

export default router;
