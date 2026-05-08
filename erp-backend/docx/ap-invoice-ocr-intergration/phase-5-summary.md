# Tóm Tắt Giai Đoạn 5 — Frontend Integration

> **Trạng thái**: ✅ Hoàn thành  
> **Ngày hoàn thành**: 01/05/2026  
> **Tác vụ hoàn thành**: 5.15, 5.16, 5.17, 5.18, 5.20, 5.21, 5.22

---

## 1. Các File Đã Tạo / Sửa

| File                                     | Loại       | Mục Đích                                                                                                                             |
| ---------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `store/apInvoice/apInvoice.types.ts`     | 🔄 Sửa     | Thêm types mới: `ApInvoiceSource`, `ApInvoiceMatchingStatus`, `MatchingDetails`, `ApInvoiceAuditLog`; cập nhật `ApInvoice` interface |
| `api/apInvoice.api.ts`                   | 🔄 Sửa     | Thêm `createManual()`, `GetAllInvoicesParams` với filter `source`                                                                    |
| `store/apInvoice/apInvoice.thunks.ts`    | 🔄 Sửa     | Thêm `createManualApInvoiceThunk`, cập nhật `getAllApInvoicesThunk` nhận params                                                      |
| `store/apInvoice/apInvoice.slice.ts`     | 🔄 Sửa     | Thêm case cho `createManualApInvoiceThunk`                                                                                           |
| `pages/ap_invoice/ApInvoicePages.tsx`    | 🔄 Sửa lớn | Thêm filter source, badges OCR/Manual/Matching, quick stats, nút "OCR Invoice"                                                       |
| `pages/ap_invoice/ViewApInvoicePage.tsx` | 🔄 Sửa lớn | Thêm section OCR info, 3-way matching details, audit trail                                                                           |

---

## 2. Thay Đổi Chi Tiết

### `apInvoice.types.ts` — Types Mới

```typescript
// Nguồn tạo invoice
type ApInvoiceSource = "manual" | "ai_ocr";

// Trạng thái 3-way matching
type ApInvoiceMatchingStatus = "pending" | "matched" | "mismatch";

// Chi tiết kết quả matching từng dòng
interface MatchingLineResult {
  ap_invoice_line_id: number;
  status: "matched" | "price_mismatch" | "qty_mismatch";
  invoice_qty: number;
  total_received: number;
  remaining_to_invoice: number;
  messages: string[];
}

interface MatchingDetails {
  summary: { total_lines; matched_lines; price_mismatches; qty_mismatches };
  line_results: MatchingLineResult[];
}

// Audit log entry
interface ApInvoiceAuditLog {
  action:
    | "created"
    | "auto_created"
    | "override_duplicate"
    | "mismatch_accepted"
    | "manual_override";
  source?: ApInvoiceSource;
  ocr_confidence?: number;
  override_reason?: string;
  created_at: string;
}

// ApInvoice interface — thêm các trường mới
interface ApInvoice {
  // ... existing fields ...
  source: ApInvoiceSource; // NEW
  ocr_confidence?: number | null; // NEW
  invoice_document_id?: number; // NEW
  matching_status: ApInvoiceMatchingStatus; // NEW
  matching_details?: MatchingDetails; // NEW
  audit_trail?: ApInvoiceAuditLog[]; // NEW (từ getById)
}
```

### `ApInvoicePages.tsx` — List View

**Thêm mới:**

- **Quick Stats bar**: 3 card hiển thị tổng hóa đơn / từ OCR / sai lệch matching
- **Filter "Nguồn tạo"**: Dropdown lọc All / Manual / OCR
- **Nút "OCR Invoice"**: Màu tím, navigate đến `/purchase/document-intelligence/upload`
- **Cột "Nguồn"**: Badge OCR (tím) hoặc Manual (xám)
- **Cột "Matching"**: Badge Matched (xanh) / Mismatch (đỏ) / Pending (xám)
- **OCR Confidence badge**: Hiển thị dưới số hóa đơn nếu source = ai_ocr
- **Export Excel**: Thêm cột Nguồn và Matching vào file xuất

### `ViewApInvoicePage.tsx` — Detail View

**Thêm mới:**

- **Section "OCR Information"** (chỉ hiện khi source = ai_ocr):
  - Badge nguồn OCR
  - Confidence badge với màu theo ngưỡng (xanh ≥85%, vàng ≥60%, đỏ <60%)
  - Link đến tài liệu gốc (Invoice Document)

- **Section "3-Way Matching"**:
  - Icon và màu theo trạng thái (xanh/đỏ/xám)
  - Summary: số dòng matched / số dòng sai lệch
  - Chi tiết từng dòng: invoice_qty, total_received, remaining_to_invoice, messages

- **Section "Lịch Sử Kiểm Toán"** (audit trail):
  - Timeline các hành động: tạo, ghi đè, chấp nhận sai lệch
  - Badge màu theo loại hành động
  - Hiển thị lý do ghi đè nếu có
  - Timestamp

---

## 3. Luồng Flow Frontend

### Luồng Xem Danh Sách

```
[Kế toán] Vào trang AP Invoice List
    ↓
getAllApInvoicesThunk() → GET /api/ap/invoices
    ↓
Hiển thị table với:
  - Badge OCR/Manual cho từng invoice
  - Badge Matched/Mismatch/Pending
  - OCR confidence % (nếu từ OCR)
  - Quick stats: tổng / OCR / mismatch

[Kế toán] Lọc theo nguồn OCR
    ↓
sourceFilter = 'ai_ocr' → filter client-side
    ↓
Chỉ hiện invoice từ OCR
```

### Luồng Xem Chi Tiết

```
[Kế toán] Click vào invoice
    ↓
getApInvoiceByIdThunk(id) → GET /api/ap/invoices/:id
    ↓ (backend trả về invoice + audit_trail)
Hiển thị:
  - Thông tin cơ bản (như cũ)
  - Section OCR Info (nếu source = ai_ocr)
  - Section 3-Way Matching (nếu có matching_status)
  - Section Audit Trail (nếu có audit_trail)
```

### Luồng Tạo Invoice Thủ Công (mới)

```
[Kế toán] Nhấn "New Invoice" → chọn PO → createFromPO (như cũ)
    HOẶC
[Kế toán] Nhấn "OCR Invoice" → navigate đến DocumentUploadPage
    ↓
Upload file → OCR → Review → Confirm
    ↓
DocumentService.confirmDocument() → createAPInvoice({ source: 'ai_ocr' })
    ↓
Navigate đến /purchase/invoices/:id
```

---

## 4. Ví Dụ Thực Tế

### Ví dụ 1 — Kế toán xem danh sách và lọc OCR

```
Trưởng phòng muốn kiểm tra tất cả hóa đơn được tạo từ OCR trong tháng:

1. Vào trang AP Invoice List
2. Quick stats hiển thị: 45 tổng / 12 từ OCR / 2 mismatch
3. Chọn filter "Nguồn tạo" = OCR
4. Table chỉ hiện 12 invoice với badge tím "OCR"
5. Thấy 2 invoice có badge đỏ "Mismatch" → cần review
6. Click vào invoice mismatch để xem chi tiết
```

### Ví dụ 2 — Kế toán xem chi tiết invoice OCR

```
Invoice #55 được tạo từ OCR, có sai lệch số lượng:

Màn hình chi tiết hiển thị:
┌─ OCR Information ──────────────────────┐
│ Nguồn: [OCR badge]                     │
│ Độ tin cậy: [92% - xanh]              │
│ Tài liệu gốc: Doc #42                 │
└────────────────────────────────────────┘

┌─ 3-Way Matching ───────────────────────┐
│ [Mismatch - đỏ]                        │
│ Matched: 1 | Sai lệch: 1              │
│                                        │
│ Dòng #101: [Lệch SL - đỏ]            │
│ Hóa đơn: 100 | Đã nhận: 80 | Còn: 80 │
│ "Số lượng hóa đơn (100) vượt quá..."  │
└────────────────────────────────────────┘

┌─ Lịch Sử Kiểm Toán ───────────────────┐
│ [Tạo hóa đơn] OCR | 92% | 08:30      │
│ [Chấp nhận sai lệch] | 08:31          │
│   Lý do: Hàng đang giao thêm          │
└────────────────────────────────────────┘
```

### Ví dụ 3 — Compliance officer kiểm tra audit trail

```
Invoice #56 bị ghi đè trùng lặp:

Audit trail hiển thị:
[Tạo hóa đơn] Manual | 09:00
[Ghi đè trùng lặp] | 09:01
  Lý do: Hóa đơn điều chỉnh lần 2

→ Compliance officer thấy rõ ai đã ghi đè, khi nào, lý do gì
```

---

## 5. Components Mới Trong ViewApInvoicePage

| Component              | Mục Đích                                       |
| ---------------------- | ---------------------------------------------- |
| `MatchingDetailsPanel` | Hiển thị summary + chi tiết từng dòng matching |
| `AuditLogRow`          | Hiển thị một entry trong audit trail           |

---

## 6. Điểm Cần Lưu Ý

1. **Filter source là client-side** — Không gọi API mới, filter trên data đã load. Nếu cần server-side filter, truyền params vào `getAllApInvoicesThunk({ source: 'ai_ocr' })`.

2. **`audit_trail` chỉ có trong `getById()`** — List view không có audit trail, chỉ detail view mới có.

3. **`matching_details` có thể null** — Khi invoice không có PO hoặc 3-way matching chưa chạy xong.

4. **Nút "OCR Invoice"** — Navigate đến DocumentUploadPage, không tạo invoice trực tiếp. Luồng tạo invoice từ OCR vẫn đi qua DocumentUploadPage → confirm.

5. **`createManualApInvoiceThunk`** — Đã thêm vào thunks và slice nhưng chưa có UI form để gọi. Cần tạo thêm `CreateManualInvoicePage` nếu muốn tạo invoice thủ công không qua PO.

---

## 7. Giai Đoạn Tiếp Theo

**Giai Đoạn 6 — Testing & Validation** cần làm:

- Integration tests cho manual creation flow
- Integration tests cho auto-create decision logic
- E2E tests cho các luồng chính
- Performance tests
