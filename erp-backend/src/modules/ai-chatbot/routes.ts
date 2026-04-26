import { Router } from "express";
import { chatController } from "./controllers/chat.controller";
import { authMiddleware } from "../../core/middleware/auth";
import { chatRateLimit } from "../../core/middleware/chatRateLimit";
import { Role } from "../../core/types/enum";

const router = Router();

// Tất cả roles đã đăng nhập đều có thể dùng chatbot
const allRoles = authMiddleware([
  Role.ADMIN,
  Role.WHMANAGER,
  Role.WHSTAFF,
  Role.SALES,
  Role.SALESMANAGER,
  Role.PURCHASE,
  Role.PURCHASEMANAGER,
  Role.ACCOUNT,
  Role.CHACC,
  Role.HRMANAGER,
  Role.CEO,
]);

router.get("/conversations", allRoles, chatController.listConversations);
router.post("/conversations", allRoles, chatController.createConversation);
router.get("/conversations/:id/messages", allRoles, chatController.getMessages);
router.post(
  "/conversations/:id/messages",
  allRoles,
  chatRateLimit,
  chatController.sendMessage,
);

export default router;
