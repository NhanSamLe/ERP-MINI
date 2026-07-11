# Hướng Dẫn Vận Hành & Luồng Dữ Liệu Chi Tiết AI Chatbot (ERP Mini)

Tài liệu này mô tả chi tiết từ A-Z cơ chế hoạt động, luồng đi của dữ liệu (Flow), tên các hàm code cụ thể ở Frontend & Backend, cơ chế gọi Tool (Function Calling) và các ví dụ thực tế end-to-end.

---

## 1. Sơ Đồ & Luồng Cuộc Gọi Hàm Hệ Thống (Function Call Flow)

Dưới đây là chi tiết thứ tự các hàm được gọi khi người dùng bắt đầu gửi tin nhắn đến chatbot cho tới khi nhận phản hồi:

### 1.1. Sơ đồ khối tổng quát (ASCII Diagram)
```text
[Người dùng UI]
      │ (1. Nhập text & click Gửi)
      ▼
[Frontend React Component] ──► Gọi: `handleSend()` ──► Gọi: `dispatch(sendMessageThunk())`
                                                               │ (2. HTTP POST)
                                                               ▼
[Backend Express Router] ──► Nhận: `POST /conversations/:id/messages` ──► Gọi: `chatController.sendMessage()`
                                                               │
                                                               ▼
[Backend Service Layer] ◄─── Gọi: `chatService.processMessage()`
   │
   ├─► 1. Gọi: `ChatMessage.create()` ──► Lưu tin nhắn user vào DB (role: 'user')
   ├─► 2. Gọi: `_handleConfirmationReply()` ──► Kiểm tra xem có đang chờ xác nhận "đồng ý/hủy" không
   ├─► 3. Gọi: `_getContextWindow()` ──► Lấy 20 tin nhắn gần nhất từ DB làm ngữ cảnh
   ├─► 4. Gọi: `LLMFactory.create()` ──► Khởi tạo Adapter OpenAI (gpt-4o-mini)
   ├─► 5. Gọi: `getToolDefinitions()` ──► Tải cấu trúc tham số (JSON Schema) của các tool
   ├─► 6. Gọi: `_runToolCallingLoop()` ──► Chạy vòng lặp Agent gửi nhận với OpenAI API
   │      │
   │      ├──► (a) Gọi: `llm.chat({ messages, tools, systemPrompt })` gửi lên OpenAI
   │      ├──► (b) Nhận yêu cầu gọi Tool từ OpenAI (tool_calls)
   │      ├──► (c) Gọi: `toolExecutor.executeAll()` để chạy các tool
   │      │         └─► Gọi: `tool.execute(arguments, context)` truy vấn Sequelize vào DB
   │      ├──► (d) Gọi: `ChatMessage.create()` lưu kết quả tool vào DB (role: 'tool')
   │      └──► (e) Lặp lại bước (a) kèm theo kết quả tool cho đến khi OpenAI trả về text thường
   │
   └─► 7. Gọi: `ChatMessage.create()` ──► Lưu câu trả lời cuối cùng của AI vào DB (role: 'assistant')
                                                               │ (3. HTTP Response 200)
                                                               ▼
[Frontend Redux Store] ──► Nhận response ──► Gọi: `fetchMessagesThunk()` ──► Render tin nhắn mới ra UI
```

---

## 2. Chi Tiết Từng Bước & Tên Hàm Thực Thi

### Bước 1: Gửi Tin Nhắn từ UI
* **Nơi thực hiện**: Giao diện chat của người dùng (`ChatPanel.tsx`).
* **Hàm khởi động**: Khi click gửi, hàm `handleSend(content)` được kích hoạt.
  - **Hàm `addOptimisticMessage`**: Đẩy tạm thời tin nhắn của người dùng vào giao diện trước để giảm độ trễ trải nghiệm.
  - **Hành động Redux**: Dispatch action `sendMessageThunk({ conversationId, content })`.
  - **Hàm gọi API**: `chatApi.sendMessage(conversationId, content)` thực hiện cuộc gọi HTTP `POST /api/chatbot/conversations/:conversationId/messages`.

### Bước 2: Tiếp Nhận & Xác Thực tại API Router
* **Nơi thực hiện**: Backend Router (`routes.ts`).
* **Middleware xác thực**: `authMiddleware([...])` giải mã token JWT, trích xuất thông tin người dùng (`user.id`, `user.branch_id`) và phân quyền.
* **Middleware giới hạn**: `chatRateLimit` kiểm tra và giới hạn số lượng tin nhắn tránh spam.
* **Hàm Controller**: Điều hướng request vào `chatController.sendMessage(req, res)`. Tại đây, hệ thống trích xuất `userToken` từ Header để chuyển tiếp cho các tool calls nếu cần.

### Bước 3: Logic Nghiệp Vụ tại Service Layer
* **Nơi thực hiện**: `chat.service.ts` -> Hàm chính `chatService.processMessage(...)`.
* **Quy trình chạy**:
  1. **Lưu tin nhắn**: Gọi `ChatMessage.create({ conversation_id, role: 'user', content })` để lưu lại câu hỏi.
  2. **Kiểm tra luồng xác nhận**: Gọi `_handleConfirmationReply(conversationId, content, context)`. Hàm này sẽ kiểm tra xem trước đó hệ thống có đang giữ hành động ghi nào chờ người dùng bấm "đồng ý / hủy" không.
  3. **Lấy ngữ cảnh lịch sử**: Gọi `_getContextWindow(conversationId)` để lấy 20 tin nhắn gần nhất. Hàm này lọc bỏ những tin nhắn không khớp ID để tránh gửi ngữ cảnh lỗi cho LLM.
  4. **Tải Tool**: Gọi `getToolDefinitions()` từ registry để lấy danh sách mô tả và tham số của các Tool gửi kèm lên LLM.

### Bước 4: Vòng Lặp Gọi Tool (Tool Calling Loop)
* **Nơi thực hiện**: `chat.service.ts` -> Hàm `_runToolCallingLoop(...)`.
* **Chi tiết vòng lặp** (Tối đa 5 lần lặp):
  1. **Gọi LLM**: Gọi `llm.chat({ messages, tools, systemPrompt })` (sử dụng Adapter OpenAI tại `openai.adapter.ts`).
  2. **Trích xuất Tool Calls**: Nếu kết quả trả về chứa danh sách `toolCalls`, hệ thống sẽ:
     - Kiểm tra nếu có tool ghi dữ liệu (ví dụ: `create_purchase_order`), hệ thống dừng luồng và tạo một bản ghi chờ duyệt `AgentPendingAction.create(...)` rồi hỏi ý kiến người dùng.
     - Nếu là tool đọc dữ liệu: Gọi `toolExecutor.executeAll(toolCalls, context)` để xử lý song song các yêu cầu.
  3. **Thực thi Tool cụ thể**: Trong `toolExecutor.ts`, hàm `execute(toolCall, context)` sẽ lấy tool cụ thể từ Registry thông qua `getTool(toolCall.name)` và chạy hàm `tool.execute(arguments, context)`.
  4. **Ghi vết**: Kết quả sau khi chạy Tool được `JSON.stringify()` và lưu vào DB thông qua `ChatMessage.create({ role: 'tool', tool_name, tool_call_id, content: JSON.stringify(data) })`.
  5. **Quay lại bước 1**: Đẩy cả kết quả Tool vào danh sách tin nhắn và gọi lại OpenAI để nhận câu trả lời cuối cùng.

---

## 3. Cơ Chế Truyền Nhận và Xử Lý Dữ Liệu với OpenAI API

Trong quá trình xử lý tin nhắn, OpenAI Adapter ([OpenAIAdapter](file:///d:/WorkSpace/TLCN/ERP-MINI/erp-backend/src/modules/ai-chatbot/services/openai.adapter.ts)) nhận đầu vào từ [chat.service.ts](file:///d:/WorkSpace/TLCN/ERP-MINI/erp-backend/src/modules/ai-chatbot/services/chat.service.ts), đóng gói và gửi request tới OpenAI API. Dưới đây là chi tiết cụ thể cấu trúc dữ liệu truyền nhận của từng pha:

### 3.1. Dữ liệu Đầu vào gửi lên OpenAI (Payload Request)

Khi hệ thống gọi `llm.chat({ messages, tools, systemPrompt })`, Adapter sẽ cấu trúc lại thành một payload JSON chuẩn của OpenAI:

1. **`systemPrompt`** (Gửi dưới role `system`): Quy định tính cách, giới hạn và nhiệm vụ của chatbot.
2. **`messages`** (Lịch sử hội thoại): Gồm danh sách các tin nhắn trước đó (vai trò `user`, `assistant`, và cả các kết quả chạy tool với vai trò `tool`).
3. **`tools`**: Các định nghĩa JSON Schema của các tool mà AI có quyền gọi (tên hàm, mô tả, các tham số bắt buộc và kiểu dữ liệu).

**Ví dụ Payload Request gửi đi từ Backend:**
```json
{
  "model": "gpt-4o-mini",
  "messages": [
    {
      "role": "system",
      "content": "Bạn là trợ lý ảo ERP Mini của công ty. Chỉ trả lời dựa trên công cụ..."
    },
    {
      "role": "user",
      "content": "Điện thoại iPhone 15 còn tồn bao nhiêu cái?"
    }
  ],
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "get_stock_balance",
        "description": "Lấy thông tin số lượng hàng tồn kho theo tên sản phẩm.",
        "parameters": {
          "type": "object",
          "properties": {
            "product_name": {
              "type": "string",
              "description": "Tên hoặc từ khóa tìm kiếm của sản phẩm"
            }
          },
          "required": ["product_name"]
        }
      }
    }
  ],
  "tool_choice": "auto"
}
```

---

### 3.2. Quá trình Xử lý của OpenAI (OpenAI Processing)

Khi nhận được Request Payload, OpenAI Engine thực hiện các bước sau:
1. **Phân tích ngữ nghĩa (Semantic Analysis)**: Hiểu câu hỏi của người dùng và xác định xem có thông tin nào cần truy vấn từ hệ thống ERP hay không.
2. **Khớp Ý định & Chọn Tool (Intent Matching)**: Đối chiếu yêu cầu `"iPhone 15"` với mô tả của các tool. OpenAI nhận diện hàm `get_stock_balance` là phù hợp nhất.
3. **Trích xuất Tham số (Parameter Extraction)**: Tự động bóc tách từ `"iPhone 15"` và điền vào thuộc tính `"product_name"` theo đúng kiểu dữ liệu `string` đã định nghĩa trong schema.
4. **Trả về Quyết định hành động**: Nếu phát hiện tham số hợp lệ, nó dừng sinh văn bản và trả về tín hiệu gọi tool (`finish_reason: "tool_calls"`).

---

### 3.3. Dữ liệu Đầu ra nhận được từ OpenAI (Payload Response)

#### Trường hợp A: OpenAI yêu cầu gọi Tool (Tool Call Request)
OpenAI trả về danh sách `tool_calls` chứa tên tool và đối số (arguments) dưới dạng chuỗi JSON String.

**Ví dụ Payload Response nhận được:**
```json
{
  "id": "chatcmpl-8zX...",
  "object": "chat.completion",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": null,
        "tool_calls": [
          {
            "id": "call_abc123xyz",
            "type": "function",
            "function": {
              "name": "get_stock_balance",
              "arguments": "{\"product_name\":\"iPhone 15\"}"
            }
          }
        ]
      },
      "finish_reason": "tool_calls"
    }
  ]
}
```

---

### 3.4. Gửi kết quả Tool lên OpenAI (Lượt gọi tiếp theo)

Sau khi Backend lấy thông tin từ DB thành công (ví dụ tìm thấy tồn kho 10 cái), Backend lưu kết quả này dưới role `"tool"` kèm `tool_call_id` tương ứng với ID gọi ban đầu và gửi lại toàn bộ lịch sử này lên OpenAI.

**Ví dụ Payload Request lượt tiếp theo:**
```json
{
  "model": "gpt-4o-mini",
  "messages": [
    {
      "role": "system",
      "content": "Bạn là trợ lý ảo ERP Mini của công ty. Chỉ trả lời dựa trên công cụ..."
    },
    {
      "role": "user",
      "content": "Điện thoại iPhone 15 còn tồn bao nhiêu cái?"
    },
    {
      "role": "assistant",
      "content": null,
      "tool_calls": [
        {
          "id": "call_abc123xyz",
          "type": "function",
          "function": {
            "name": "get_stock_balance",
            "arguments": "{\"product_name\":\"iPhone 15\"}"
          }
        }
      ]
    },
    {
      "role": "tool",
      "tool_call_id": "call_abc123xyz",
      "content": "[{\"warehouse\":\"Kho chính HCM\",\"product\":\"iPhone 15 Pro Max 256GB\",\"quantity\":10}]"
    }
  ]
}
```

#### Trường hợp B: OpenAI trả về Văn bản hoàn chỉnh (Final Output)
Nhận được kết quả thực tế từ cơ sở dữ liệu, OpenAI phân tích và tổng hợp thành câu trả lời tự nhiên.

**Ví dụ Payload Response cuối cùng:**
```json
{
  "id": "chatcmpl-8zY...",
  "object": "chat.completion",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Trong kho chính HCM của bạn hiện đang còn tồn 10 chiếc iPhone 15 Pro Max 256GB."
      },
      "finish_reason": "stop"
    }
  ]
}
```

---

## 4. Các Ví Dụ Chạy Thực Tế End-To-End Chi Tiết

### Ví dụ 1: Tra cứu tồn kho (Luồng đọc dữ liệu)
1. **Người dùng nhắn**: `"Điện thoại iPhone 15 còn tồn bao nhiêu cái?"`
2. **Frontend**: Gọi `chatApi.sendMessage(id, "Điện thoại iPhone 15 còn tồn bao nhiêu cái?")`.
3. **Backend Controller**: Nhận yêu cầu và gọi `chatService.processMessage(...)`.
4. **Backend Service**:
   - `ChatMessage.create()` lưu câu hỏi của user.
   - `_getContextWindow()` lấy lịch sử hội thoại.
   - `_runToolCallingLoop()` gọi OpenAI.
5. **OpenAI API**: Nhận dạng sản phẩm "iPhone 15" và yêu cầu gọi tool:
   - Tên hàm: `get_stock_balance`
   - Tham số: `{"product_name": "iPhone 15"}`
6. **Backend Executor**: Chạy `toolExecutor.execute(...)` -> Tìm thấy tool `get_stock_balance` -> Chạy truy vấn DB:
   - **Mã thực thi (Sequelize)**:
     ```javascript
     const balances = await StockBalance.findAll({
       include: [
         { model: Warehouse, where: { branch_id: context.branchId } },
         { model: Product, where: { name: { [Op.like]: "%iPhone 15%" } } }
       ]
     });
     ```
   - **Kết quả trả về**:
     ```json
     [
       { "warehouse": "Kho chính HCM", "product": "iPhone 15 Pro Max 256GB", "quantity": 10 }
     ]
     ```
7. **Backend Service**:
   - Lưu kết quả trên vào DB dưới dạng message `role: "tool"`.
   - Gửi lại lịch sử mới cho OpenAI.
8. **OpenAI API**: Nhận thông tin tồn kho và dịch thành văn bản:
   `"Trong kho chính HCM của bạn hiện đang còn tồn 10 chiếc iPhone 15 Pro Max 256GB."`
9. **Frontend**: Nhận kết quả và cập nhật lại giao diện.

---

### Ví dụ 2: Tạo đơn mua hàng PO (Luồng ghi dữ liệu có xác nhận)
1. **Người dùng nhắn**: `"Tạo đơn mua hàng 5 cái iPhone 15 từ nhà cung cấp ABC Supplies với giá 20 triệu/cái"`
2. **Backend Service**:
   - OpenAI phân tích cần ID của nhà cung cấp và sản phẩm. Nó yêu cầu gọi cùng lúc:
     - `get_partners({"name": "ABC Supplies"})` -> Trả về ID `12`
     - `get_products({"name": "iPhone 15"})` -> Trả về ID `99` và UOM mặc định.
   - Sau khi nhận được kết quả ID ở lượt gọi tiếp theo, OpenAI yêu cầu gọi tool `create_purchase_order`.
   - Do `create_purchase_order` nằm trong danh sách các tool làm thay đổi dữ liệu (`WRITE_TOOLS`), hệ thống sẽ **ngăn chặn không cho ghi trực tiếp**.
3. **Backend Intercept**:
   - Hàm `_runToolCallingLoop` chặn yêu cầu tạo PO.
   - Gọi `AgentPendingAction.create(...)` để lưu trữ dữ liệu tạm thời vào cơ sở dữ liệu:
     ```json
     {
       "tool_name": "create_purchase_order",
       "tool_args": "{\"supplier_id\":12,\"items\":[{\"product_id\":99,\"quantity\":5,\"price\":20000000}]}",
       "status": "pending"
     }
     ```
   - Trả về câu hỏi xác nhận cho user: *"Tôi đã chuẩn bị đơn mua hàng 5 chiếc iPhone 15 từ ABC Supplies với giá 20.000.000 đ. Bạn có đồng ý tạo đơn không?"*
4. **Người dùng nhắn**: `"Đồng ý"`
5. **Backend Service**:
   - Hàm `_handleConfirmationReply()` phát hiện từ khóa "Đồng ý".
   - Chuyển trạng thái bản ghi pending thành `executed`.
   - Tìm kiếm tool `create_purchase_order` và trực tiếp thực thi hàm `execute(pending.getParsedArgs(), context)`.
   - Hàm thực thi tạo bản ghi PO mới vào Database và trả về thông tin PO số `#PO-2026-0005`.
   - Gọi hàm `_buildSuccessMessage` trả về kết quả thành công và đề xuất bước tiếp theo (gửi duyệt PO).

---

### Ví dụ 3: Tra cứu danh sách lô hàng sắp hết hạn (Nghiệp vụ Quản lý Kho)
1. **Thủ kho nhắn**: `"Xem các lô hàng sắp hết hạn trong 30 ngày tới"`
2. **Backend Service**:
   - OpenAI nhận diện câu hỏi khớp với mô tả của tool `get_expiring_lots` và yêu cầu gọi tool:
     - Tên hàm: `get_expiring_lots`
     - Tham số: `{"days": 30}`
3. **Backend Executor**: Chạy `toolExecutor.execute(...)` -> Tìm thấy tool `get_expiring_lots` -> Chạy truy vấn DB:
   - **Mã thực thi (Sequelize)**:
     ```javascript
     const expiringLots = await StockLot.findAll({
       where: {
         expiration_date: {
           [Op.and]: {
             [Op.gt]: new Date(),
             [Op.lte]: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
           }
         }
       },
       include: [{ model: Warehouse, where: { branch_id: context.branchId } }]
     });
     ```
   - **Kết quả trả về**:
     ```json
     [
       { "lot_number": "LOT-IP15-001", "product": "iPhone 15 Pro", "expiration_date": "2026-08-05", "quantity": 10 }
     ]
     ```
4. **Backend Service**:
   - Lưu kết quả này dưới dạng message `role: "tool"`.
   - Gửi lại lịch sử mới cho OpenAI để tổng hợp câu trả lời.
5. **OpenAI API**: Nhận kết quả và định dạng thành câu trả lời:
   `"Tôi tìm thấy 1 lô hàng sắp hết hạn trong 30 ngày tới:\n- Lô **LOT-IP15-001** (Sản phẩm: iPhone 15 Pro, số lượng: 10) sẽ hết hạn vào ngày **05/08/2026**."`

---

## 4. Danh Sách Liên Kết File Dự Án (Reference Links)

[FloatingChatButton.tsx]: file:///d:/WorkSpace/TLCN/ERP-MINI/erp-frontend/src/features/ai-chatbot/components/FloatingChatButton.tsx
[ChatPanel.tsx]: file:///d:/WorkSpace/TLCN/ERP-MINI/erp-frontend/src/features/ai-chatbot/components/ChatPanel.tsx
[ChatInput.tsx]: file:///d:/WorkSpace/TLCN/ERP-MINI/erp-frontend/src/features/ai-chatbot/components/ChatInput.tsx
[routes.ts]: file:///d:/WorkSpace/TLCN/ERP-MINI/erp-backend/src/modules/ai-chatbot/routes.ts
[chat.service.ts]: file:///d:/WorkSpace/TLCN/ERP-MINI/erp-backend/src/modules/ai-chatbot/services/chat.service.ts
[tool.executor.ts]: file:///d:/WorkSpace/TLCN/ERP-MINI/erp-backend/src/modules/ai-chatbot/services/tool.executor.ts
