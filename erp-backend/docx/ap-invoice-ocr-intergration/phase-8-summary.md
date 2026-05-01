# Tóm Tắt Giai Đoạn 8 — Cấu Hình & Khả Mở Rộng

> **Trạng thái**: ✅ Hoàn thành  
> **Ngày hoàn thành**: 01/05/2026  
> **Tác vụ hoàn thành**: 8.1, 8.8 → 8.12

---

## 1. Các File Đã Tạo / Sửa

| File                                                                       | Loại   | Mục Đích                                           |
| -------------------------------------------------------------------------- | ------ | -------------------------------------------------- |
| `erp-backend/.env`                                                         | 🔄 Sửa | Thêm 7 env variables OCR còn thiếu                 |
| `src/modules/document-intelligence/services/ocrConfig.service.ts`          | ✅ Mới | OCRConfigService — tải, validate, log config       |
| `src/modules/document-intelligence/services/ocrEngine.factory.ts`          | 🔄 Sửa | Dùng ocrConfig thay vì đọc env trực tiếp           |
| `src/modules/document-intelligence/middleware/invoiceUpload.middleware.ts` | 🔄 Sửa | Dùng MAX_FILE_SIZE_MB từ config                    |
| `src/app.ts`                                                               | 🔄 Sửa | Gọi `ocrConfig.logConfigOnStartup()` khi khởi động |

---

## 2. Env Variables Mới Trong `.env`

```env
# ─── OCR & Document Intelligence ─────────────────────────────────────────────
# OCR Engine: openai_vision | google_doc_ai
OCR_ENGINE=openai_vision

# Ngưỡng confidence tối thiểu để tạo invoice tự động (0.0 - 1.0)
OCR_MIN_CONFIDENCE_AUTO_CREATE=0.85

# Ngưỡng confidence tối thiểu để khớp nhà cung cấp
VENDOR_MATCH_MIN_CONFIDENCE=0.90

# Ngưỡng confidence tối thiểu để khớp sản phẩm
PRODUCT_MATCH_MIN_CONFIDENCE=0.80

# Cho phép tạo tự động khi có sai lệch 3-way matching (true | false)
AUTO_CREATE_WITH_MISMATCHES=false

# Kích thước file tối đa (MB)
MAX_FILE_SIZE_MB=10

# Timeout OCR (milliseconds)
OCR_TIMEOUT_MS=25000
```

---

## 3. OCRConfigService — Chi Tiết

### Singleton Pattern

```typescript
// Lấy instance (singleton)
const config = OCRConfigService.getInstance();
// Hoặc dùng export sẵn
import { ocrConfig } from "./ocrConfig.service";
```

### Các Phương Thức

| Phương Thức                  | Mô Tả                                               |
| ---------------------------- | --------------------------------------------------- |
| `getConfig()`                | Trả về toàn bộ config object                        |
| `get(key)`                   | Lấy một giá trị config cụ thể                       |
| `logConfigOnStartup()`       | Log tất cả config khi server khởi động (ẩn API key) |
| `validateConfig()` (private) | Validate và throw nếu config không hợp lệ           |
| `loadConfig()` (private)     | Tải từ env với fallback defaults                    |

### Validation Rules

| Variable                         | Rule                                         |
| -------------------------------- | -------------------------------------------- |
| `OCR_ENGINE`                     | Phải là `openai_vision` hoặc `google_doc_ai` |
| `OCR_MIN_CONFIDENCE_AUTO_CREATE` | 0.0 ≤ value ≤ 1.0                            |
| `VENDOR_MATCH_MIN_CONFIDENCE`    | 0.0 ≤ value ≤ 1.0                            |
| `PRODUCT_MATCH_MIN_CONFIDENCE`   | 0.0 ≤ value ≤ 1.0                            |
| `MAX_FILE_SIZE_MB`               | 1 ≤ value ≤ 100                              |
| `OCR_TIMEOUT_MS`                 | 5000 ≤ value ≤ 120000                        |

---

## 4. Luồng Flow Cấu Hình

### Khi Server Khởi Động

```
app.ts
    ↓
import ocrConfig (singleton)
    ↓
OCRConfigService.constructor()
    ├─ loadConfig() — đọc từ process.env với defaults
    └─ validateConfig() — throw nếu config sai
    ↓
ocrConfig.logConfigOnStartup()
    ↓
Logger output:
  === OCR Configuration ===
    Engine:                    openai_vision
    Model:                     gpt-4o-mini
    Timeout:                   25000ms
    Min Confidence (auto):     0.85
    Vendor Match Min:          0.90
    Product Match Min:         0.80
    Auto Create w/ Mismatches: false
    Max File Size:             10MB
    API Key:                   sk-proj-HH...
  =========================
```

### Khi Upload File

```
POST /api/documents/upload
    ↓
invoiceUploadMiddleware
    ├─ ocrConfig.get("maxFileSizeMb") → 10
    └─ multer limits: { fileSize: 10 * 1024 * 1024 }
    ↓
Nếu file > 10MB → "File quá lớn. Kích thước tối đa là 10MB."
```

### Khi Tạo OCR Engine

```
OcrEngineFactory.create()
    ├─ ocrConfig.get("ocrEngine") → "openai_vision"
    ├─ ocrConfig.get("openaiApiKey") → "sk-proj-..."
    ├─ ocrConfig.get("ocrTimeoutMs") → 25000
    └─ ocrConfig.get("openaiModel") → "gpt-4o-mini"
    ↓
new OpenAIVisionOcr(apiKey, model, timeoutMs)
```

---

## 5. Ví Dụ Thực Tế

### Ví dụ 1 — Dev environment với ngưỡng thấp hơn

```env
# .env.development
OCR_MIN_CONFIDENCE_AUTO_CREATE=0.70  # Thấp hơn để test dễ hơn
VENDOR_MATCH_MIN_CONFIDENCE=0.70
AUTO_CREATE_WITH_MISMATCHES=true     # Cho phép test với mismatch
MAX_FILE_SIZE_MB=5                   # Giới hạn nhỏ hơn cho dev
```

### Ví dụ 2 — Production với ngưỡng cao

```env
# .env.production
OCR_MIN_CONFIDENCE_AUTO_CREATE=0.90  # Cao hơn để đảm bảo chất lượng
VENDOR_MATCH_MIN_CONFIDENCE=0.95
AUTO_CREATE_WITH_MISMATCHES=false    # Không cho phép mismatch
MAX_FILE_SIZE_MB=10
OCR_TIMEOUT_MS=30000                 # Timeout dài hơn cho production
```

### Ví dụ 3 — Config validation fail fast

```
Server khởi động với OCR_MIN_CONFIDENCE_AUTO_CREATE=1.5
    ↓
OCRConfigService.validateConfig()
    ↓
Error: "OCR Config validation failed:
  - OCR_MIN_CONFIDENCE_AUTO_CREATE phải trong khoảng 0.0 - 1.0, hiện tại: 1.5"
    ↓
Server không khởi động → Admin biết ngay cần fix config
```

---

## 6. Điểm Cần Lưu Ý

1. **Singleton** — `ocrConfig` được khởi tạo một lần khi import lần đầu. Nếu env thay đổi sau khi server chạy, cần restart server.

2. **Fail Fast** — Nếu config không hợp lệ, server sẽ throw error ngay khi khởi động. Đây là behavior mong muốn — tốt hơn là để server chạy với config sai.

3. **API Key ẩn trong log** — `logConfigOnStartup()` chỉ hiển thị 8 ký tự đầu của API key để tránh lộ secret trong log files.

4. **Branch-level config** (8.11-8.13) — Chưa triển khai. Đây là tính năng nâng cao cho phép mỗi chi nhánh có ngưỡng riêng. Có thể thêm sau khi có nhu cầu thực tế.

5. **`OcrEngineFactory` đã được cập nhật** — Không còn đọc `process.env` trực tiếp, thay vào đó dùng `ocrConfig.get()`. Điều này giúp dễ mock trong tests.

---

## 7. Giai Đoạn Tiếp Theo

**Giai Đoạn 9 — Tài Liệu & Deployment** (cuối cùng):

- Migration scripts và rollback plan
- Deployment checklist
- API documentation summary
