import { Router } from "express";
import { SaleOrderController } from "../controllers/saleOrder.controller";
import { authMiddleware } from "../../../core/middleware/auth";

const router = Router();

// Lấy danh sách (filter theo branch + role)
router.get("/", authMiddleware([]), SaleOrderController.getAll);

// Chi tiết đơn hàng
router.get("/:id", authMiddleware([]), SaleOrderController.getOne);

// Tạo đơn hàng
router.post("/", authMiddleware([]), SaleOrderController.create);

// Cập nhật đơn hàng (chỉ khi draft)
router.put("/:id", authMiddleware([]), SaleOrderController.update);

// Gửi duyệt
router.post("/:id/submit", authMiddleware([]), SaleOrderController.submit);

// Sale Manager duyệt
router.post("/:id/approve", authMiddleware([]), SaleOrderController.approve);

// Sale Manager từ chối
router.post("/:id/reject", authMiddleware([]), SaleOrderController.reject);

export default router;
