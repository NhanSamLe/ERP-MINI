# Phân Tích Luồng AI Chatbot — ERP Mini

## Tổng Quan Kiến Trúc

```
Client (HTTP)
    │
    ▼
[routes.ts] → authMiddleware (JWT + RBAC)
    │
    ▼
[chat.controller.ts]
    │
    ▼
[chat.service.ts]  ←──────────────────────────────────┐
    │                                                  │
    ├─ Lưu user message vào DB                        │
    ├─ Lấy context window (20 messages gần nhất)      │
    ▼                                                  │
[LLMFactory] → [OpenAIAdapter]                        │
    │                                                  │
    ▼                                                  │
  OpenAI API (gpt-4o-mini)                            │
    │                                                  │
    ├─ Nếu có tool_calls ──► [ToolExecutor]           │
    │                              │                   │
    │                              ▼                   │
    │                        [Tool Registry]           │
    │                        (14 tools)                │
    │                              │                   │
    │                              ▼                   │
    │                        Tool.execute()            │
    │                        (query DB trực tiếp)      │
    │                              │                   │
    │                        Tool Result ──────────────┘
    │                        (thêm vào context, loop lại)
    │
    └─ Nếu không có tool_calls → trả về text
    │
    ▼
Lưu assistant message vào DB → trả về client
```

---

## Luồng Chi Tiết

### 1. Request vào hệ thống

**File:** `routes.ts` → `chat.controller.ts`

```
POST /api/chatbot/conversations/:id/messages
Authorization: Bearer <JWT>
Body: { content: "Tồn kho iPhone 15 còn bao nhiêu?" }
```

- `authMiddleware` decode JWT, gắn `req.user` (id, role, branch_id)
- Controller extract `userToken` từ header để forward cho tool calls
- Validate content không rỗng trước khi xử lý

---

### 2. Kiểm tra ownership & lưu message

**File:** `chat.service.ts` → `processMessage()`

```typescript
// Kiểm tra conversation thuộc về user này không
const conv = await Conversation.findOne({ where: { id, user_id: userId } });

// Lưu user message vào DB ngay lập tức
await ChatMessage.create({ conversation_id, role: "user", content });

// Auto-title: lấy 80 ký tự đầu của message đầu tiên
if (!conv.title) await conv.update({ title: content.slice(0, 80) });
```

**Lưu ý:** Message được lưu DB trước khi gọi LLM — đảm bảo không mất dữ liệu dù LLM lỗi.

---

### 3. Lấy Context Window

**File:** `chat.service.ts` → `_getContextWindow()`

```typescript
const CONTEXT_WINDOW = 20; // Lấy 20 messages gần nhất

// Lấy DESC rồi reverse → đúng thứ tự chronological
const messages = await ChatMessage.findAll({
  order: [["created_at", "DESC"]],
  limit: CONTEXT_WINDOW,
});
return messages.reverse();
```

Context window giới hạn 20 messages để kiểm soát chi phí token. Mỗi lần chat chỉ gửi tối đa 20 messages lịch sử lên OpenAI.

---

### 4. Tool Calling Loop

**File:** `chat.service.ts` → `_runToolCallingLoop()`

Đây là phần cốt lõi của chatbot. Vòng lặp tối đa **5 iterations**:

```
Iteration 1:
  → Gửi messages + tools lên OpenAI
  ← OpenAI trả về: tool_calls = [{ name: "get_stock_balance", args: { product_name: "iPhone 15" } }]
  → Thực thi tool → query DB → kết quả: [{ product: "iPhone 15", quantity: 47 }]
  → Thêm assistant message (có tool_calls) vào context
  → Thêm tool result vào context

Iteration 2:
  → Gửi messages (bao gồm tool result) lên OpenAI
  ← OpenAI trả về: content = "Tồn kho iPhone 15 hiện còn 47 chiếc..."
  → Không có tool_calls → thoát vòng lặp, trả về text
```

**Quan trọng:** OpenAI yêu cầu message sequence đúng thứ tự:

```
user → assistant (có tool_calls) → tool (result) → assistant (text)
```

---

### 5. OpenAI Adapter

**File:** `openai.adapter.ts`

Map `LLMMessage[]` sang format OpenAI:

| LLMMessage role             | OpenAI role                  | Ghi chú                 |
| --------------------------- | ---------------------------- | ----------------------- |
| `user`                      | `user`                       | Câu hỏi của người dùng  |
| `assistant` (có tool_calls) | `assistant` + `tool_calls[]` | LLM quyết định gọi tool |
| `tool`                      | `tool` + `tool_call_id`      | Kết quả từ tool         |
| `assistant` (text)          | `assistant`                  | Câu trả lời cuối        |

**Lỗi phổ biến đã fix:** Nếu assistant message không có `tool_calls` field khi gửi lên OpenAI, API trả về lỗi 400: _"messages with role 'tool' must be a response to a preceding message with 'tool_calls'"_

---

### 6. Tool Executor

**File:** `tool.executor.ts`

```typescript
// Không throw exception — luôn trả về ToolResult
// LLM sẽ xử lý lỗi thay vì crash server
async execute(toolCall, context): Promise<ToolResult> {
  const tool = getTool(toolCall.name);
  if (!tool) return { success: false, error: "Tool không tồn tại" };

  try {
    return await tool.execute(toolCall.arguments, context);
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Thực thi song song nhiều tools
async executeAll(toolCalls, context): Promise<ToolResult[]> {
  return Promise.all(toolCalls.map(tc => this.execute(tc, context)));
}
```

---

### 7. Tool Registry & Tools

**File:** `tools/registry.ts`

14 tools được đăng ký, chia theo domain:

| Domain    | Tools                                                          |
| --------- | -------------------------------------------------------------- |
| Inventory | `get_stock_balance`, `get_expiring_lots`, `get_stock_movement` |
| Sales     | (sales.tools.ts)                                               |
| Purchase  | (purchase.tools.ts)                                            |
| CRM       | (crm.tools.ts)                                                 |
| HRM       | (hrm.tools.ts)                                                 |
| Finance   | (finance.tools.ts)                                             |

**Cách tools query DB (inventory làm ví dụ):**

```typescript
// Gọi thẳng Sequelize model — không qua HTTP
// context.branchId đảm bảo multi-tenant isolation
const data = await StockBalance.findAll({
  include: [
    { model: Warehouse, where: { branch_id: context.branchId } },
    {
      model: Product,
      where: { name: { [Op.like]: `%${args.product_name}%` } },
    },
  ],
});
```

---

### 8. Database Schema

**Bảng `chat_conversations`:**

```sql
id, user_id, branch_id, title, is_active, created_at, updated_at
```

**Bảng `chat_messages`:**

```sql
id, conversation_id, role (user|assistant|tool), content (TEXT),
tool_name, tool_call_id, created_at
```

**Lưu ý:** Tool messages cũng được lưu DB với `tool_name` và `tool_call_id` để reconstruct đúng context khi load lại conversation.

---

## 10 Kinh Nghiệm Rút Ra

### 1. Tool result phải là JSON parseable

Tool result được `JSON.stringify()` trước khi gửi lên LLM. Nếu data quá lớn (hàng trăm records), LLM sẽ tốn nhiều token và có thể bị truncate. Nên giới hạn `limit` trong query và chỉ trả về fields cần thiết.

### 2. Assistant message phải có `tool_calls` khi gửi lại OpenAI

OpenAI validate message sequence nghiêm ngặt. Nếu có message `role: "tool"` mà message trước đó không phải `role: "assistant"` có `tool_calls`, API trả về lỗi 400. Phải lưu `tool_calls` vào `LLMMessage` và map đúng khi gửi lên.

### 3. Gemini và OpenAI có format tool calling khác nhau

- OpenAI: `role: "tool"` + `tool_call_id`
- Gemini: `role: "function"` + `functionResponse: { name, response }`

Nếu sau này muốn hỗ trợ lại Gemini, cần adapter riêng biệt, không dùng chung được.

### 4. `context.branchId` là chìa khóa multi-tenant

Mọi tool query đều phải filter theo `branch_id` từ context. Nếu quên, user có thể xem data của branch khác — lỗ hổng bảo mật nghiêm trọng.

### 5. Tool không nên throw exception

`ToolExecutor` bắt tất cả exception và trả về `{ success: false, error }`. LLM sẽ đọc error message và thông báo cho user thay vì crash server. Đây là pattern quan trọng cho production.

### 6. Context window ảnh hưởng trực tiếp đến chi phí

`CONTEXT_WINDOW = 20` nghĩa là mỗi request gửi tối đa 20 messages lịch sử. Với conversation dài, chi phí tăng tuyến tính. Nên cân nhắc giảm xuống 10 cho production hoặc implement summarization.

### 7. Tool messages trong DB cần `tool_call_id`

Khi load lại conversation từ DB, cần reconstruct đúng sequence `assistant (tool_calls) → tool (result)`. Nếu không lưu `tool_call_id`, không thể rebuild context đúng cho các conversation cũ.

### 8. `MAX_ITERATIONS = 5` là safety net

Nếu LLM bị loop (cứ gọi tool mãi không trả về text), vòng lặp sẽ dừng sau 5 lần và trả về message lỗi. Với `gpt-4o-mini`, thực tế thường chỉ cần 1-2 iterations.

### 9. Dynamic import trong tools tránh circular dependency

```typescript
const { StockBalance } =
  await import("../../inventory/models/stockBalance.model");
```

Dùng dynamic import thay vì static import ở đầu file để tránh circular dependency giữa modules và giảm startup time.

### 10. `userToken` được forward vào tool context

Tools nhận JWT token của user để có thể gọi các API nội bộ với đúng quyền. Tuy nhiên hiện tại các inventory tools đã query DB trực tiếp nên `userToken` chỉ cần thiết cho `callErpApi()` trong các tools khác.

### 11. System prompt không được lưu DB

System prompt chỉ tồn tại trong memory, được inject vào mỗi request. Điều này đúng — không cần lưu vì nó là constant. Nhưng nếu muốn customize system prompt theo role/user, cần thêm logic ở đây.

### 12. Auto-title conversation từ message đầu tiên

```typescript
if (!conv.title) await conv.update({ title: content.slice(0, 80) });
```

UX tốt — user không cần đặt tên conversation thủ công. Tuy nhiên nên dùng LLM để generate title ngắn gọn hơn thay vì cắt 80 ký tự đầu.

### 13. Tool definitions gửi lên LLM mỗi request

`getToolDefinitions()` được gọi mỗi lần `processMessage()`. Với 14 tools, mỗi tool definition tốn ~100-200 tokens. Tổng ~2000 tokens chỉ cho tool definitions. Nên cache kết quả này ở module level.

### 14. Parallel tool execution

```typescript
return Promise.all(toolCalls.map((tc) => this.execute(tc, context)));
```

Nếu LLM gọi nhiều tools cùng lúc (ví dụ: vừa hỏi tồn kho vừa hỏi doanh thu), tất cả được thực thi song song — tốt cho performance.

### 15. Không lưu `tool_calls` metadata vào DB

Hiện tại `ChatMessage` không có column lưu `tool_calls` của assistant message. Khi load lại conversation từ DB, `_getContextWindow()` không thể reconstruct assistant message có `tool_calls`. Điều này có thể gây lỗi nếu conversation cũ có tool calls chưa hoàn thành. Cần thêm column `tool_calls_json TEXT` vào bảng `chat_messages`.

---

## Điểm Cần Cải Thiện

| Vấn đề                            | Mức độ     | Giải pháp                                         |
| --------------------------------- | ---------- | ------------------------------------------------- |
| Không lưu `tool_calls` vào DB     | Cao        | Thêm column `tool_calls_json` vào `chat_messages` |
| Tool definitions không được cache | Trung bình | Cache `getToolDefinitions()` ở module level       |
| Context window cố định            | Trung bình | Implement token counting, tự động điều chỉnh      |
| Auto-title dùng cắt chuỗi         | Thấp       | Dùng LLM generate title ngắn gọn                  |
| Không có rate limiting per user   | Cao        | Thêm middleware giới hạn request/minute           |
