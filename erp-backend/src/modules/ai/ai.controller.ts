import { Request, Response } from 'express';
import { chatService } from './services/chat.service';
import { syncService } from './services/sync.service';
import type { ChatRequest, ERPModule } from './types/ai.types';
import { ChatMessage } from '../ai-chatbot/models/message.model';
import { Conversation } from '../ai-chatbot/models/conversation.model';

export class AIController {
  /**
   * POST /api/ai/chat
   */
  async chat(req: Request, res: Response): Promise<void> {
    try {
      const body = req.body as ChatRequest;

      if (!body.message?.trim()) {
        res.status(400).json({ error: 'message is required' });
        return;
      }

      const userRole = (req as any).user?.role;
      const result = await chatService.chat({ ...body, userRole });
      res.json(result);
    } catch (err) {
      console.error('[AI] chat error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * POST /api/ai/chat/stream
   * Stream RAG response using Server-Sent Events (SSE)
   */
  async chatStream(req: Request, res: Response): Promise<void> {
    try {
      const body = req.body as ChatRequest;

      if (!body.message?.trim()) {
        res.status(400).json({ error: 'message is required' });
        return;
      }

      // Lưu user message vào cơ sở dữ liệu nếu có conversationId
      if (body.conversationId) {
        await ChatMessage.create({
          conversation_id: body.conversationId,
          role: 'user',
          content: body.message,
        });

        // Cập nhật tiêu đề cuộc trò chuyện nếu tiêu đề đang trống
        const conv = await Conversation.findByPk(body.conversationId);
        if (conv && !conv.title) {
          await conv.update({ title: body.message.slice(0, 80) });
        }
      }

      // 1. Set SSE Headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      const userRole = (req as any).user?.role;
      // 2. Lấy stream từ chatService
      const generator = chatService.chatStream({ ...body, userRole });

      let fullAssistantText = '';

      // 3. Đọc từng chunk và gửi về client
      for await (const item of generator) {
        res.write(`data: ${JSON.stringify(item)}\n\n`);
        if (item.chunk) {
          fullAssistantText += item.chunk;
        }
      }

      // Lưu assistant message phản hồi vào DB
      if (body.conversationId && fullAssistantText) {
        await ChatMessage.create({
          conversation_id: body.conversationId,
          role: 'assistant',
          content: fullAssistantText,
        });

        // Cập nhật updated_at của conversation
        const conv = await Conversation.findByPk(body.conversationId);
        if (conv) {
          await conv.update({ updated_at: new Date() } as any);
        }
      }

      // 4. Kết thúc stream
      res.write('data: [DONE]\n\n');
      res.end();
    } catch (err) {
      console.error('[AI] chatStream error:', err);
      res.write(`data: ${JSON.stringify({ error: 'Internal server error' })}\n\n`);
      res.end();
    }
  }

  /**
   * POST /api/ai/sync
   * Body: { module?: ERPModule } — nếu không có module thì sync tất cả
   */
  async sync(req: Request, res: Response): Promise<void> {
    try {
      const results = await syncService.fullSync();
      res.json({ success: true, results });
    } catch (err) {
      console.error('[AI] sync error:', err);
      res.status(500).json({ error: 'Sync failed' });
    }
  }

  /**
   * GET /api/ai/health
   */
  async health(_req: Request, res: Response): Promise<void> {
    res.json({
      status:  'ok',
      ollama:  'http://localhost:11434',
      qdrant:  'http://localhost:6333',
      model:   'qwen2.5:7b',
      embed:   'bge-m3',
    });
  }
}

export const aiController = new AIController();
