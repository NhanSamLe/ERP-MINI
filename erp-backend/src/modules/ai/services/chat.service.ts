import { Ollama } from 'ollama';
import OpenAI from 'openai';
import { env } from '../../../config/env';
import { embeddingService } from './embedding.service';
import { qdrantService } from './qdrant.service';
import type { ChatRequest, ChatResponse, ChatMessage, ERPModule } from '../types/ai.types';

const ollama = new Ollama({ host: env.ollama.host });
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.LLM_API_KEY,
});

export class ChatService {
  /**
   * RAG pipeline hoàn chỉnh — non-streaming
   */
  async chat(req: ChatRequest): Promise<ChatResponse> {
    const provider = process.env.RAG_PROVIDER || 'ollama';
    const activeModel = provider === 'openai' ? 'gpt-4o-mini' : 'qwen2.5:7b';
    const { message, module, history = [], top_k = 5, userRole } = req;

    // 1. Tìm context từ Qdrant
    const queryVector = await embeddingService.embed(message);
    const searchOpts: { module?: ERPModule; top_k?: number; userRole?: string | undefined } = { top_k, userRole };
    if (module !== undefined) {
      searchOpts.module = module;
    }
    const sources = await qdrantService.search(queryVector, searchOpts);

    // 2. Build context string
    const contextText = sources.length > 0
      ? sources
          .map(s => `[${s.entity_type.toUpperCase()} | score: ${s.score.toFixed(2)}]\n${s.content_text}`)
          .join('\n\n')
      : 'Không tìm thấy dữ liệu liên quan trong hệ thống.';

    // 3. Build messages
    const systemPrompt = `Bạn là AI assistant của hệ thống ERP Mini. 
Nhiệm vụ: trả lời câu hỏi của người dùng dựa trên dữ liệu thực tế bên dưới.

Quy tắc bắt buộc:
- CHỈ dùng thông tin trong phần DỮ LIỆU ERP
- Nếu không có thông tin, trả lời: "Không tìm thấy dữ liệu phù hợp trong hệ thống"
- Trả lời ngắn gọn, chính xác bằng tiếng Việt
- Với số tiền: định dạng có dấu phân cách (1,000,000 VND)
- Với ngày tháng: định dạng dd/mm/yyyy

DỮ LIỆU ERP:
${contextText}`;

    const messages: any[] = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-6), // Giữ 6 turns gần nhất
      { role: 'user', content: message },
    ];

    // 4. Gọi mô hình dựa trên cấu hình
    if (provider === 'openai') {
      const response = await openai.chat.completions.create({
        model:    activeModel,
        messages: messages,
        stream:   false,
      });
      return {
        answer:  response.choices[0]?.message?.content || 'Không thể tạo phản hồi.',
        sources,
        model:   activeModel,
      };
    } else {
      const response = await ollama.chat({
        model:    activeModel,
        messages: messages,
        stream:   false,
      });
      return {
        answer:  response.message.content,
        sources,
        model:   activeModel,
      };
    }
  }

  /**
   * RAG pipeline với streaming
   */
  async *chatStream(req: ChatRequest): AsyncGenerator<any> {
    const provider = process.env.RAG_PROVIDER || 'ollama';
    const activeModel = provider === 'openai' ? 'gpt-4o-mini' : 'qwen2.5:7b';
    const { message, module, history = [], top_k = 5, userRole } = req;

    const queryVector = await embeddingService.embed(message);
    const searchOpts: { module?: ERPModule; top_k?: number; userRole?: string | undefined } = { top_k, userRole };
    if (module !== undefined) {
      searchOpts.module = module;
    }
    const sources = await qdrantService.search(queryVector, searchOpts);

    // Yield sources first
    yield { sources };

    const contextText = sources.length > 0
      ? sources
          .map(s => `[${s.entity_type.toUpperCase()} | score: ${s.score.toFixed(2)}]\n${s.content_text}`)
          .join('\n\n')
      : 'Không tìm thấy dữ liệu liên quan trong hệ thống.';

    const systemPrompt = `Bạn là AI assistant của hệ thống ERP Mini. 
Nhiệm vụ: trả lời câu hỏi của người dùng dựa trên dữ liệu thực tế bên dưới.

Quy tắc bắt buộc:
- CHỈ dùng thông tin trong phần DỮ LIỆU ERP
- Nếu không có thông tin, trả lời: "Không tìm thấy dữ liệu phù hợp trong hệ thống"
- Trả lời ngắn gọn, chính xác bằng tiếng Việt
- Với số tiền: định dạng có dấu phân cách (1,000,000 VND)
- Với ngày tháng: định dạng dd/mm/yyyy

DỮ LIỆU ERP:
${contextText}`;

    const messages: any[] = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-6),
      { role: 'user', content: message },
    ];

    if (provider === 'openai') {
      const responseStream = await openai.chat.completions.create({
        model:    activeModel,
        messages: messages,
        stream:   true,
      });

      for await (const chunk of responseStream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          yield { chunk: content };
        }
      }
    } else {
      const responseStream = await ollama.chat({
        model:    activeModel,
        messages: messages,
        stream:   true,
      });

      for await (const chunk of responseStream) {
        yield { chunk: chunk.message.content };
      }
    }
  }
}

export const chatService = new ChatService();
