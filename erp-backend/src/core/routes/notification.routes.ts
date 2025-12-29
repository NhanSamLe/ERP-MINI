// notification.routes.ts
import express from "express";
import { notificationController } from "../controllers/notification.controller";
import { authMiddleware } from "../middleware/auth";

const router = express.Router();

// Tất cả routes đều cần authentication (không cần role cụ thể)
router.use(authMiddleware([]));


// GET /api/notifications - Lấy danh sách thông báo
router.get("/", notificationController.getNotifications);

// GET /api/notifications/unread-count - Lấy số lượng chưa đọc
router.get("/unread-count", notificationController.getUnreadCount);

// PUT /api/notifications/read-all - Đánh dấu tất cả đã đọc
router.put("/read-all", notificationController.markAllAsRead);

// PUT /api/notifications/:id/read - Đánh dấu một thông báo đã đọc
router.put("/:id/read", notificationController.markAsRead);

// DELETE /api/notifications/:id - Xóa thông báo
router.delete("/:id", notificationController.deleteNotification);

export default router;
