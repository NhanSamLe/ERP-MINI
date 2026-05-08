# Developer Setup Guide — AP Invoice OCR Integration

> **Dành cho**: Developer mới join team hoặc setup môi trường dev

---

## 1. Yêu Cầu Hệ Thống

- Node.js >= 18
- MySQL >= 8.0
- OpenAI API Key (có thể dùng mock mode để test)

---

## 2. Setup Nhanh

### Bước 1: Clone và cài dependencies

```bash
git clone <repo>
cd erp-backend
npm install
```

### Bước 2: Cấu hình `.env`

Copy file `.env.example` (nếu có) hoặc tạo `.env` với nội dung tối thiểu:

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=123456
DB_NAME=erp_mini3

# JWT
JWT_SECRET=supersecret

# OCR — Dùng mock mode khi dev để không tốn quota
OCR_ENGINE=openai_vision
LLM_API_KEY=sk-proj-...   # Thay bằng key thật hoặc dùng USE_MOCK_LLM=true
USE_MOCK_LLM=false

# OCR Thresholds (có thể giảm xuống khi dev)
OCR_MIN_CONFIDENCE_AUTO_CREATE=0.70
VENDOR_MATCH_MIN_CONFIDENCE=0.70
PRODUCT_MATCH_MIN_CONFIDENCE=0.60
AUTO_CREATE_WITH_MISMATCHES=true
MAX_FILE_SIZE_MB=10
OCR_TIMEOUT_MS=25000
```

### Bước 3: Chạy migrations

```bash
npx sequelize-cli db:migrate
```

### Bước 4: Chạy server

```bash
npm run dev
```

Server sẽ log OCR config khi khởi động:

```
=== OCR Configuration ===
  Engine:                    openai_vision
  Min Confidence (auto):     0.70
  ...
=========================
```

---

## 3. Cấu Hình OCR Engine

### Dùng OpenAI Vision (mặc định)

```env
OCR_ENGINE=openai_vision
LLM_API_KEY=sk-proj-...
LLM_MODEL=gpt-4o-mini
OCR_TIMEOUT_MS=25000
```

### Dùng Mock Mode (không tốn quota)

```env
USE_MOCK_LLM=true
```

Khi `USE_MOCK_LLM=true`, OCR sẽ trả về dữ liệu giả để test UI mà không cần gọi OpenAI.

---

## 4. Troubleshooting

### Lỗi: "OCR Config validation failed"

```
Error: OCR Config validation failed:
  - OCR_MIN_CONFIDENCE_AUTO_CREATE phải trong khoảng 0.0 - 1.0
```

**Nguyên nhân**: Giá trị env không hợp lệ.  
**Fix**: Kiểm tra `.env` và đảm bảo các giá trị trong khoảng cho phép.

---

### Lỗi: "Cannot find module '../modules/ai-chatbot/models/conversation.model'"

**Nguyên nhân**: Module ai-chatbot chưa được build.  
**Fix**:

```bash
npm run build
# hoặc
npx tsc
```

---

### Lỗi: OCR timeout

```
Error: OCR processing timeout after 25000ms
```

**Nguyên nhân**: OpenAI API chậm hoặc file quá lớn.  
**Fix**: Tăng `OCR_TIMEOUT_MS=60000` trong `.env`.

---

### Lỗi: File upload thất bại

```
Error: File quá lớn. Kích thước tối đa là 10MB.
```

**Fix**: Giảm kích thước file hoặc tăng `MAX_FILE_SIZE_MB=20`.

---

### Invoice không được tạo tự động (confidence thấp)

**Nguyên nhân**: `ocr_confidence < OCR_MIN_CONFIDENCE_AUTO_CREATE`  
**Fix khi dev**: Giảm ngưỡng xuống `OCR_MIN_CONFIDENCE_AUTO_CREATE=0.50`

---

## 5. Chạy Tests

```bash
# Tất cả tests
npx vitest run

# Chỉ unit tests
npx vitest run src/modules/document-intelligence/__tests__/unit/

# Chỉ integration tests
npx vitest run src/modules/purchase/__tests__/integration/

# Watch mode (khi dev)
npx vitest
```

---

## 6. Cấu Trúc Module OCR

```
src/modules/document-intelligence/
├── controllers/
│   └── document.controller.ts      # API handlers
├── middleware/
│   ├── documentRateLimit.ts        # Rate limiting
│   └── invoiceUpload.middleware.ts # File upload (multer)
├── models/
│   └── invoiceDocument.model.ts    # Sequelize model
├── services/
│   ├── document.service.ts         # Main service
│   ├── ocrConfig.service.ts        # Config singleton
│   ├── ocrEngine.factory.ts        # Factory pattern
│   ├── openaiVisionOcr.service.ts  # OpenAI Vision
│   ├── vendorMatcher.service.ts    # Fuzzy vendor matching
│   ├── productMatcher.service.ts   # Fuzzy product matching
│   ├── duplicateDetector.service.ts # Duplicate detection
│   ├── threeWayMatcher.service.ts  # 3-way matching
│   └── invoiceParser.service.ts    # Parse OCR output
└── routes.ts                       # Express routes

src/modules/purchase/
├── models/
│   ├── apInvoice.model.ts          # AP Invoice model (với OCR fields)
│   ├── apInvoiceLine.model.ts      # AP Invoice Line (với matching fields)
│   └── apInvoiceAuditLog.model.ts  # Audit log model
└── services/
    ├── apInvoice.service.ts        # Unified createAPInvoice()
    └── apInvoiceAuditLog.service.ts # Audit trail service
```

---

## 7. Luồng Code Khi Upload Hóa Đơn

```
POST /api/documents/upload
    ↓
invoiceUploadMiddleware (multer, validate file)
    ↓
documentController.uploadDocument()
    ↓
DocumentService.uploadDocument()
    ├─ Lưu file vào uploads/invoices/
    ├─ Tạo InvoiceDocument (ocr_status='pending')
    └─ processOcr() [async, không await]
           ↓
    OcrEngineFactory.create() → OpenAIVisionOcr
           ↓
    engine.extract(filePath) → raw OCR result
           ↓
    InvoiceParser.parseOcrResult() → structured data
           ↓
    InvoiceDocument.update(ocr_status='done', ocr_result)
```
