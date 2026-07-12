import { Request, Response } from "express";
import { chatService } from "../services/chat.service";

function handleError(res: Response, err: any) {
  const status = typeof err?.status === "number" ? err.status : 500;
  const message = err?.message ?? "Đã xảy ra lỗi, vui lòng thử lại";
  res.status(status).json({ message });
}

export const chatController = {
  /** GET /api/chatbot/conversations */
  async listConversations(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = await chatService.listConversations(user.id);
      res.json({ conversations: data });
    } catch (err: any) {
      handleError(res, err);
    }
  },

  /** POST /api/chatbot/conversations */
  async createConversation(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { title } = req.body;
      const conv = await chatService.createConversation(
        user.id,
        user.branch_id,
        title,
      );
      res.status(201).json({ conversation: conv });
    } catch (err: any) {
      handleError(res, err);
    }
  },

  /** GET /api/chatbot/conversations/:id/messages */
  async getMessages(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const id = Number(req.params.id ?? "");
      const messages = await chatService.getMessages(id, user.id);
      res.json({ messages });
    } catch (err: any) {
      handleError(res, err);
    }
  },

  /** POST /api/chatbot/conversations/:id/messages */
  async sendMessage(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const id = Number(req.params.id ?? "");
      const { content } = req.body;

      if (!content?.trim()) {
        return res
          .status(400)
          .json({ message: "Tin nhắn không được để trống" });
      }

      const authHeader = req.headers.authorization ?? "";
      const userToken = authHeader.replace("Bearer ", "");

      const message = await chatService.processMessage(
        id,
        user.id,
        user.branch_id,
        userToken,
        content.trim(),
        user.role,
      );

      res.json({ message });
    } catch (err: any) {
      handleError(res, err);
    }
  },
};
