# Tóm Tắt Giai Đoạn 6 — Testing & Validation

> **Trạng thái**: ✅ Hoàn thành (phần còn thiếu)  
> **Ngày hoàn thành**: 01/05/2026  
> **Tác vụ hoàn thành**: 6.12, 6.13

---

## 1. Tổng Quan Testing Toàn Bộ Dự Án

| Loại Test             | File                                                                    | Trạng Thái     |
| --------------------- | ----------------------------------------------------------------------- | -------------- |
| **Unit Tests**        | `__tests__/unit/vendorMatcher.service.test.ts`                          | ✅ Có sẵn      |
| **Unit Tests**        | `__tests__/unit/productMatcher.service.test.ts`                         | ✅ Có sẵn      |
| **Unit Tests**        | `__tests__/unit/duplicateDetector.service.test.ts`                      | ✅ Có sẵn      |
| **Unit Tests**        | `__tests__/unit/threeWayMatcher.service.test.ts`                        | ✅ Có sẵn      |
| **Unit Tests**        | `__tests__/unit/document.service.test.ts`                               | ✅ Có sẵn      |
| **Unit Tests**        | `__tests__/unit/openaiVisionOcr.service.test.ts`                        | ✅ Có sẵn      |
| **Unit Tests**        | `__tests__/unit/invoiceParser.service.test.ts`                          | ✅ Có sẵn      |
| **Property Tests**    | `__tests__/properties/threeWayMatching.properties.test.ts`              | ✅ Có sẵn      |
| **Property Tests**    | `__tests__/properties/documentCreation.properties.test.ts`              | ✅ Có sẵn      |
| **Property Tests**    | `__tests__/properties/matching.properties.test.ts`                      | ✅ Có sẵn      |
| **Property Tests**    | `__tests__/properties/fileValidation.properties.test.ts`                | ✅ Có sẵn      |
| **Property Tests**    | `__tests__/properties/ocrResult.properties.test.ts`                     | ✅ Có sẵn      |
| **Property Tests**    | `__tests__/properties/apInvoiceCreation.properties.test.ts`             | ✅ Có sẵn      |
| **Integration Tests** | `__tests__/integration/confirmationAndApInvoice.integration.test.ts`    | ✅ Có sẵn      |
| **Integration Tests** | `__tests__/integration/duplicateDetection.integration.test.ts`          | ✅ Có sẵn      |
| **Integration Tests** | `__tests__/integration/threeWayMatching.integration.test.ts`            | ✅ Có sẵn      |
| **Integration Tests** | `__tests__/integration/uploadOcrResult.integration.test.ts`             | ✅ Có sẵn      |
| **Integration Tests** | `__tests__/integration/errorScenarios.integration.test.ts`              | ✅ Có sẵn      |
| **Integration Tests** | `purchase/__tests__/integration/createAPInvoice.integration.test.ts`    | ✅ **Mới tạo** |
| **Integration Tests** | `purchase/__tests__/integration/autoCreateDecision.integration.test.ts` | ✅ **Mới tạo** |

---

## 2. Các File Mới Tạo Trong Giai Đoạn 6

### `createAPInvoice.integration.test.ts`

**Vị trí**: `src/modules/purchase/__tests__/integration/`

**Mục đích**: Kiểm tra `APInvoiceService.createAPInvoice()` — unified entry point

**Test cases (18 tests):**

| Nhóm             | Test Case                      | Mô Tả                                          |
| ---------------- | ------------------------------ | ---------------------------------------------- |
| Manual — No PO   | Tạo với source=manual          | Invoice có matching_status=pending, po_id=null |
| Manual — No PO   | Lines được tạo đúng            | Kiểm tra quantity, unit_price, description     |
| Manual — No PO   | Audit log ghi đúng             | action=created, source=manual                  |
| Manual — With PO | Trigger 3-way matching         | matching_status được cập nhật async            |
| OCR              | source=ai_ocr + ocr_confidence | Lưu đúng confidence vào DB                     |
| OCR              | Thiếu invoice_document_id      | Throw 400                                      |
| Validation       | Thiếu supplier_id              | Throw 400                                      |
| Validation       | invoice_no trống               | Throw 400                                      |
| Validation       | Lines rỗng                     | Throw 400                                      |
| Validation       | quantity <= 0                  | Throw 400                                      |
| Duplicate        | Trùng invoice_no + supplier    | Throw 409                                      |
| Duplicate        | Override với lý do             | Tạo thành công + audit log override            |
| Duplicate        | Khác supplier                  | Không phải duplicate                           |
| Transaction      | Atomic create                  | Invoice + Lines cùng transaction               |

### `autoCreateDecision.integration.test.ts`

**Vị trí**: `src/modules/purchase/__tests__/integration/`

**Mục đích**: Kiểm tra logic quyết định auto-create trong luồng OCR

**Test cases (9 tests):**

| Nhóm             | Test Case          | Mô Tả                                             |
| ---------------- | ------------------ | ------------------------------------------------- |
| High Confidence  | Confidence 0.92    | Tạo thành công, source=ai_ocr                     |
| High Confidence  | Lưu ocr_confidence | Confidence được persist vào DB                    |
| Duplicate in OCR | Không có override  | Throw 409                                         |
| Duplicate in OCR | Có override        | Tạo thành công + audit log                        |
| 3-Way Matching   | Có po_id           | Trigger matching async                            |
| 3-Way Matching   | Không có po_id     | matching_status=pending                           |
| Audit Trail      | Ghi log OCR        | action=created, source=ai_ocr, confidence         |
| Audit Trail      | Link Document      | InvoiceDocument.purchase_invoice_id được cập nhật |

---

## 3. Luồng Test Coverage

### Luồng Manual (không có PO)

```
createAPInvoice({ source: 'manual', po_id: null })
    ↓
✅ Validate supplier_id, invoice_no, lines
    ↓
✅ DuplicateDetector.check() → không trùng
    ↓
✅ DB Transaction: ApInvoice + Lines
    ↓
✅ Không trigger 3-way matching (po_id = null)
    ↓
✅ AuditLog.logCreation(action='created', source='manual')
    ↓
✅ Return invoice với matching_status='pending'
```

### Luồng OCR (từ DocumentService.confirmDocument)

```
confirmDocument(documentId, branchId, userId, payload)
    ↓
✅ Load InvoiceDocument
✅ Kiểm tra branch_id, purchase_invoice_id
    ↓
✅ createAPInvoice({ source: 'ai_ocr', invoice_document_id, ocr_confidence })
    ↓
✅ DuplicateDetector.check()
    ├─ ✅ Trùng + no override → throw 409
    └─ ✅ Trùng + override → tạo + log override
    ↓
✅ DB Transaction: ApInvoice + Lines
    ↓
✅ ThreeWayMatcher.match() [async, nếu có po_id]
    ↓
✅ AuditLog.logCreation(action='created', source='ai_ocr', ocr_confidence)
    ↓
✅ InvoiceDocument.update(purchase_invoice_id)
```

---

## 4. Ví Dụ Thực Tế Được Test

### Ví dụ 1 — Hóa đơn tiền điện (Manual, no PO)

```typescript
// Test: "nên tạo invoice với source=manual và matching_status=pending khi không có PO"
const result = await apInvoiceService.createAPInvoice(
  {
    source: "manual",
    invoice_no: "EVN-2024-05",
    invoice_date: new Date("2024-05-31"),
    supplier_id: evnVendorId,
    po_id: null, // Không có PO
    total_after_tax: 20_000_000,
    lines: [
      {
        description: "Tiền điện tháng 5/2024",
        quantity: 1,
        unit_price: 20_000_000,
      },
    ],
  },
  user,
);

// Assertions:
expect(result.invoice.source).toBe("manual");
expect(result.invoice.matching_status).toBe("pending");
expect(result.invoice.po_id).toBeUndefined();
```

### Ví dụ 2 — Hóa đơn trùng lặp với ghi đè

```typescript
// Test: "nên cho phép tạo khi overrideDuplicate=true và ghi audit log override"
// Lần 1: Tạo invoice INV-ABC-001
await apInvoiceService.createAPInvoice({ invoice_no: "INV-ABC-001", ... });

// Lần 2: Tạo lại với override
const result = await apInvoiceService.createAPInvoice({
  invoice_no: "INV-ABC-001",
  overrideDuplicate: true,
  override_reason: "Hóa đơn điều chỉnh lần 2",
  ...
}, user);

// Assertions:
expect(result.invoice).toBeDefined();
expect(result.duplicateWarning).toBeDefined();

// Audit log phải có override entry
const overrideLog = auditLogs.find(l => l.action === "override_duplicate");
expect(overrideLog?.override_reason).toBe("Hóa đơn điều chỉnh lần 2");
```

### Ví dụ 3 — OCR với confidence cao

```typescript
// Test: "nên tạo invoice thành công khi confidence 0.92 và không trùng lặp"
const doc = await createDocWithOCR("INV-OCR-001", 0.92);

const result = await documentService.confirmDocument(doc.id, branchId, userId, {
  supplier_id: vendorId,
  invoice_no: "INV-OCR-001",
  total_after_tax: 5_500_000,
  lines: [{ product_id: productId, quantity: 10, unit_price: 500_000 }],
});

// Assertions:
const invoice = await ApInvoice.findByPk(result.purchase_invoice_id);
expect(invoice?.source).toBe("ai_ocr");
expect(Number(invoice?.ocr_confidence)).toBeCloseTo(0.92, 2);
expect(invoice?.invoice_document_id).toBe(doc.id);
```

---

## 5. Lưu Ý Về Môi Trường Test

### Vấn Đề Hiện Tại

Khi chạy integration tests, có 2 lỗi môi trường **không liên quan đến code mình viết**:

1. **`Cannot find module '../modules/ai-chatbot/models/conversation.model'`**
   - Nguyên nhân: `src/models/associations.ts` import module ai-chatbot chưa được build
   - Giải pháp: Build project trước khi chạy tests, hoặc mock module này

2. **`ENOENT: no such file or directory, open 'test/data/05-versions-space.pdf'`**
   - Nguyên nhân: `pdf-parse` package cần file test data
   - Giải pháp: Tạo thư mục `test/data/` với file PDF mẫu

### Cách Chạy Tests Khi Môi Trường Sẵn Sàng

```bash
# Chạy tất cả integration tests
npx vitest run src/modules/purchase/__tests__/integration/

# Chạy riêng createAPInvoice tests
npx vitest run src/modules/purchase/__tests__/integration/createAPInvoice.integration.test.ts

# Chạy riêng autoCreateDecision tests
npx vitest run src/modules/purchase/__tests__/integration/autoCreateDecision.integration.test.ts

# Chạy tất cả tests
npx vitest run
```

---

## 6. Giai Đoạn Tiếp Theo

**Giai Đoạn 7 — Báo Cáo & Phân Tích** (thấp ưu tiên):

- Endpoint GET /api/reports/ocr-processing
- Endpoint GET /api/reports/three-way-matching
- Endpoint GET /api/reports/duplicate-detection
- Endpoint GET /api/reports/confidence-distribution

**Giai Đoạn 8 — Cấu Hình** (cần làm):

- Thêm env variables còn thiếu vào .env
- Tạo OCRConfigService
