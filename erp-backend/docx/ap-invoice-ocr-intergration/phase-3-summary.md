# Tóm Tắt Giai Đoạn 3 — Dịch Vụ Chính (Core Services)

> **Trạng thái**: ✅ Hoàn thành  
> **Ngày hoàn thành**: 01/05/2026  
> **Tác vụ hoàn thành**: 3.19 → 3.36 (+ 1.12 → 1.14 từ Giai Đoạn 1)

---

## 1. Các File Đã Tạo / Sửa

| File                                                             | Loại       | Mục Đích                                                                  |
| ---------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------- |
| `src/migrations/20260502000000-create-ap-invoice-audit-logs.js`  | ✅ Mới     | Migration tạo bảng `ap_invoice_audit_logs` trong DB                       |
| `src/modules/purchase/models/apInvoiceAuditLog.model.ts`         | ✅ Mới     | Sequelize model ánh xạ bảng audit logs                                    |
| `src/modules/purchase/services/apInvoiceAuditLog.service.ts`     | ✅ Mới     | Service ghi/đọc lịch sử kiểm toán                                         |
| `src/modules/purchase/services/apInvoice.service.ts`             | 🔄 Sửa lớn | Thêm `createAPInvoice()` — unified entry point; refactor `createFromPO()` |
| `src/modules/document-intelligence/services/document.service.ts` | 🔄 Sửa     | Refactor `confirmDocument()` để gọi qua `createAPInvoice()`               |

---

## 2. Mục Đích Từng File

### `20260502000000-create-ap-invoice-audit-logs.js`

Tạo bảng `ap_invoice_audit_logs` với các cột:

- `ap_invoice_id` — FK đến ap_invoices
- `action` — loại hành động: `created`, `auto_created`, `override_duplicate`, `mismatch_accepted`, `manual_override`
- `source` — nguồn gốc: `manual` | `ai_ocr`
- `ocr_confidence` — điểm tin cậy OCR (nếu có)
- `matching_status` — kết quả 3-way matching
- `matching_details` — JSON chi tiết sai lệch
- `override_reason` — lý do ghi đè (nếu có)
- `created_by` — user thực hiện

### `apInvoiceAuditLog.model.ts`

Sequelize model cho bảng trên. Không có `updatedAt` vì audit log là bất biến — chỉ ghi, không sửa.

### `apInvoiceAuditLog.service.ts`

Cung cấp 4 phương thức:

- `logCreation()` — ghi log khi invoice được tạo
- `logOverride()` — ghi log khi user ghi đè cảnh báo (trùng lặp, sai lệch)
- `logMismatch()` — ghi log khi 3-way matching phát hiện sai lệch nhưng vẫn cho tạo
- `getAuditTrail()` — lấy toàn bộ lịch sử của một invoice

> **Lưu ý thiết kế**: Tất cả phương thức log đều `try/catch` nội bộ và không throw — audit log không được làm fail business logic chính.

### `apInvoice.service.ts` — Thay Đổi Chính

**Thêm mới: `createAPInvoice(input, user)`**

Đây là **unified entry point** — điểm vào duy nhất để tạo AP Invoice, xử lý cả 2 luồng:

- `source = 'manual'` — kế toán tạo thủ công
- `source = 'ai_ocr'` — tạo từ kết quả OCR

Luồng xử lý bên trong:

```
1. Validation
   ├─ supplier_id bắt buộc
   ├─ invoice_no không trống
   ├─ lines phải có ít nhất 1 dòng
   ├─ quantity > 0, unit_price >= 0
   └─ nếu source='ai_ocr' → invoice_document_id bắt buộc

2. Duplicate Detection
   ├─ Gọi DuplicateDetectorService.check(invoice_no, supplier_id, branch_id)
   ├─ Nếu trùng + overrideDuplicate=false → throw 409
   └─ Nếu trùng + overrideDuplicate=true → ghi nhận warning, tiếp tục

3. DB Transaction (atomic)
   ├─ Tạo ApInvoice record
   └─ Tạo ApInvoiceLine records (bulk)

4. Three-Way Matching (async, không block response)
   └─ Chỉ chạy nếu có po_id

5. Audit Trail Logging
   ├─ logCreation() — luôn ghi
   └─ logOverride() — chỉ ghi nếu có ghi đè trùng lặp

6. Return invoice đầy đủ (với lines, supplier, order)
```

**Sửa: `createFromPO(poId, user)`**

Giữ nguyên signature để không break code cũ. Nội bộ gọi `createAPInvoice()` với `source='manual'`. Kết quả: tất cả logic validation, audit trail, 3-way matching đều được áp dụng tự động.

**Sửa: `getAll()`**

Thêm hỗ trợ lọc theo `source` (manual | ai_ocr) trong query params.

**Sửa: `approve()`**

Lấy `supplier_id` trực tiếp từ `invoice.supplier_id` thay vì chỉ từ `invoice.order.supplier_id` — hỗ trợ invoice không có PO (hóa đơn dịch vụ, tiền điện, v.v.).

### `document.service.ts` — Thay Đổi Chính

**Sửa: `confirmDocument()`**

Trước đây tự tạo `ApInvoice` và `ApInvoiceLine` trực tiếp bằng Sequelize. Giờ gọi qua `apInvoiceService.createAPInvoice()`. Lợi ích:

- Không còn duplicate logic giữa 2 service
- Tự động có validation, audit trail, 3-way matching
- Một điểm duy nhất để sửa business logic

---

## 3. Luồng Flow Tổng Thể Sau Giai Đoạn 3

### Luồng OCR (từ upload đến invoice)

```
[Frontend] Upload file hóa đơn
    ↓
POST /api/documents/upload
    ↓
DocumentService.uploadDocument()
    ├─ Lưu file vào local storage
    ├─ Tạo InvoiceDocument (ocr_status='pending')
    └─ Trigger processOcr() [async]
           ↓
    OcrEngineFactory.create() → OpenAIVisionOcr.extract()
           ↓
    InvoiceParser.parseOcrResult() → ocr_result JSON
           ↓
    InvoiceDocument.update(ocr_status='done', ocr_result, ocr_confidence)

[Frontend] Polling GET /api/documents/:id/status
    ↓ (khi done)
GET /api/documents/:id/result
    ↓
DocumentService.getEnrichedResult()
    ├─ VendorMatcherService.match() → matchedPartnerId + confidence
    ├─ ProductMatcherService.matchItems() → product matches
    └─ DuplicateDetectorService.check() → duplicateWarning

[Frontend] Kế toán review, chỉnh sửa, nhấn "Xác nhận"
    ↓
POST /api/documents/:id/confirm
    ↓
DocumentService.confirmDocument()
    └─ APInvoiceService.createAPInvoice({ source: 'ai_ocr', ... })
           ├─ Validate
           ├─ Duplicate check
           ├─ DB Transaction: ApInvoice + Lines
           ├─ ThreeWayMatcher [async]
           ├─ AuditLog.logCreation()
           └─ Return invoice
    ↓
InvoiceDocument.update(purchase_invoice_id = newInvoiceId)
    ↓
Response: { purchase_invoice_id: 42 }
```

### Luồng Thủ Công (không có OCR)

```
[Frontend] Kế toán điền form tạo hóa đơn thủ công
    ↓
POST /api/ap-invoices  (endpoint mới — Giai Đoạn 4)
    ↓
APInvoiceService.createAPInvoice({ source: 'manual', po_id: null, ... })
    ├─ Validate
    ├─ Duplicate check
    ├─ DB Transaction: ApInvoice + Lines
    ├─ matching_status = 'pending' (không có PO → bỏ qua 3-way)
    ├─ AuditLog.logCreation()
    └─ Return invoice
```

---

## 4. Ví Dụ Thực Tế

### Ví dụ 1 — Hóa đơn OCR từ Công ty ABC (có PO)

**Bối cảnh**: Công ty nhận hóa đơn giấy từ nhà cung cấp ABC, scan và upload lên hệ thống.

```
Input createAPInvoice:
{
  source: 'ai_ocr',
  invoice_no: 'INV-ABC-2024-001',
  invoice_date: 2024-05-01,
  supplier_id: 12,          // Công ty ABC
  po_id: 88,                // PO đã đặt hàng trước
  invoice_document_id: 42,  // File scan đã upload
  ocr_confidence: 0.92,
  total_before_tax: 45_000_000,
  total_tax: 4_500_000,
  total_after_tax: 49_500_000,
  lines: [
    { product_id: 5, quantity: 100, unit_price: 450_000, ... }
  ]
}

Kết quả:
- ApInvoice tạo với id=55, source='ai_ocr', matching_status='pending'
- ThreeWayMatcher chạy async → so sánh với GRN của PO-88
  → Nếu GRN nhận đủ 100 cái → matching_status='matched'
  → Nếu GRN chỉ nhận 80 cái → matching_status='mismatch', log mismatch
- AuditLog: action='created', source='ai_ocr', ocr_confidence=0.92
```

### Ví dụ 2 — Hóa đơn tiền điện (không có PO)

**Bối cảnh**: Công ty nhận hóa đơn tiền điện tháng 5, không có PO.

```
Input createAPInvoice:
{
  source: 'manual',
  invoice_no: 'EVN-2024-05',
  invoice_date: 2024-05-31,
  supplier_id: 7,   // Công ty điện lực
  po_id: null,      // Không có PO
  total_after_tax: 20_000_000,
  lines: [
    { product_id: null, description: 'Tiền điện tháng 5', quantity: 1, unit_price: 20_000_000 }
  ]
}

Kết quả:
- ApInvoice tạo với source='manual', matching_status='pending'
- Không chạy ThreeWayMatcher (po_id = null)
- AuditLog: action='created', source='manual'
- Kế toán submit → Trưởng phòng approve → GL Entry ghi nợ TK 156, có TK 331
```

### Ví dụ 3 — Hóa đơn trùng lặp

**Bối cảnh**: Kế toán vô tình upload hóa đơn INV-ABC-2024-001 lần 2.

```
Lần 1: createAPInvoice({ invoice_no: 'INV-ABC-2024-001', supplier_id: 12, ... })
→ Tạo thành công, invoice id=55

Lần 2: createAPInvoice({ invoice_no: 'INV-ABC-2024-001', supplier_id: 12, ... })
→ DuplicateDetector phát hiện trùng
→ throw { status: 409, duplicate: { existingInvoiceId: 55 } }
→ Frontend hiển thị: "Hóa đơn INV-ABC-2024-001 đã tồn tại (id=55). Có muốn ghi đè?"

Nếu kế toán xác nhận ghi đè:
→ createAPInvoice({ ..., overrideDuplicate: true, override_reason: 'Hóa đơn điều chỉnh' })
→ Tạo invoice mới id=56
→ AuditLog: action='override_duplicate', override_reason='Hóa đơn điều chỉnh'
```

---

## 5. Cấu Trúc Bảng ap_invoice_audit_logs

```sql
ap_invoice_audit_logs
├─ id              BIGINT PK
├─ ap_invoice_id   BIGINT FK → ap_invoices(id) CASCADE
├─ action          VARCHAR(50)  -- created | auto_created | override_duplicate | mismatch_accepted | manual_override
├─ source          VARCHAR(20)  -- manual | ai_ocr
├─ ocr_confidence  DECIMAL(5,4) -- 0.0000 → 1.0000
├─ matching_status VARCHAR(20)  -- pending | matched | mismatch
├─ matching_details JSON        -- chi tiết sai lệch từ ThreeWayMatcher
├─ override_reason TEXT         -- lý do ghi đè
├─ created_by      BIGINT FK → users(id)
└─ created_at      TIMESTAMP
```

---

## 6. Điểm Cần Lưu Ý

1. **Three-Way Matching chạy async** — không block response. Kết quả matching_status sẽ được cập nhật sau vài giây. Frontend cần polling hoặc websocket để hiển thị kết quả matching.

2. **Audit log không throw** — nếu ghi log thất bại, business logic vẫn tiếp tục. Lỗi chỉ được ghi vào logger.

3. **`createFromPO()` vẫn hoạt động** — code cũ không bị break. Nội bộ gọi `createAPInvoice()` với `source='manual'`.

4. **`supplier_id` bắt buộc** — kể cả invoice không có PO. Đây là thay đổi so với thiết kế cũ (trước đây supplier_id lấy từ PO).

5. **`getAll()` hỗ trợ lọc theo `source`** — có thể filter `?source=ai_ocr` hoặc `?source=manual` để xem riêng từng loại.

---

## 7. Giai Đoạn Tiếp Theo

**Giai Đoạn 4 — API Endpoints** cần làm:

- `POST /api/ap-invoices` — endpoint tạo invoice thủ công (gọi `createAPInvoice`)
- `GET /api/ap-invoices/:id` — thêm `matching_details` và audit trail vào response
- `GET /api/ap-invoices` — đã hỗ trợ lọc `source` (đã làm trong giai đoạn này)
- Integration tests cho APInvoiceController
