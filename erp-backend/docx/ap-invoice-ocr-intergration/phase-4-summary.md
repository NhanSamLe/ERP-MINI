# Tóm Tắt Giai Đoạn 4 — API Endpoints

> **Trạng thái**: ✅ Hoàn thành  
> **Ngày hoàn thành**: 01/05/2026  
> **Tác vụ hoàn thành**: 4.13, 4.14, 4.16, 4.17

---

## 1. Các File Đã Tạo / Sửa

| File                                                       | Loại       | Mục Đích                                                                                   |
| ---------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------ |
| `src/modules/purchase/controllers/apInvoice.controller.ts` | 🔄 Sửa lớn | Thêm `createManual()`, cập nhật `getById()` trả về audit trail, thêm `handleError()` chuẩn |
| `src/modules/purchase/routes/apInvoice.routes.ts`          | 🔄 Sửa     | Thêm `POST /` cho tạo thủ công, tách role rõ ràng                                          |

> **Lưu ý**: DocumentController (`/api/documents/*`) đã hoàn chỉnh từ trước — không cần sửa thêm.

---

## 2. Danh Sách Endpoints Đầy Đủ Sau Giai Đoạn 4

### AP Invoice — `/api/ap/invoices`

| Method | Path                | Auth           | Mô Tả                                                               |
| ------ | ------------------- | -------------- | ------------------------------------------------------------------- |
| `GET`  | `/`                 | ACCOUNT, CHACC | Lấy danh sách. Hỗ trợ filter: `status`, `approval_status`, `source` |
| `GET`  | `/:id`              | ACCOUNT, CHACC | Chi tiết invoice + `matching_details` + `audit_trail`               |
| `GET`  | `/posted-summary`   | ACCOUNT, CHACC | Tổng hợp công nợ theo nhà cung cấp                                  |
| `GET`  | `/posted-suppliers` | ACCOUNT, CHACC | Danh sách nhà cung cấp có invoice posted                            |
| `POST` | `/`                 | ACCOUNT        | **Mới** — Tạo invoice thủ công (manual)                             |
| `POST` | `/from-po/:poId`    | ACCOUNT        | Tạo từ PO (backward compatible)                                     |
| `POST` | `/:id/submit`       | ACCOUNT        | Gửi phê duyệt                                                       |
| `PUT`  | `/:id/approve`      | CHACC          | Phê duyệt + ghi GL Entry                                            |
| `PUT`  | `/:id/reject`       | CHACC          | Từ chối                                                             |

### Document Intelligence — `/api/documents` (đã có từ trước)

| Method | Path               | Mô Tả                                                     |
| ------ | ------------------ | --------------------------------------------------------- |
| `POST` | `/upload`          | Upload file hóa đơn, trigger OCR                          |
| `GET`  | `/:id/status`      | Polling trạng thái OCR                                    |
| `GET`  | `/:id/result`      | Kết quả OCR đã làm giàu (vendor/product match, duplicate) |
| `POST` | `/:id/confirm`     | Xác nhận → gọi `createAPInvoice({ source: 'ai_ocr' })`    |
| `GET`  | `/history`         | Lịch sử tài liệu OCR                                      |
| `GET`  | `/po-suggestions`  | Gợi ý PO cho nhà cung cấp                                 |
| `POST` | `/check-duplicate` | Kiểm tra trùng lặp trước khi tạo                          |

### Matching — `/api/matching`

| Method | Path          | Mô Tả                            |
| ------ | ------------- | -------------------------------- |
| `POST` | `/three-way`  | Chạy 3-way matching thủ công     |
| `GET`  | `/:invoiceId` | Lấy kết quả matching của invoice |

---

## 3. Chi Tiết Thay Đổi

### `createManual()` — Endpoint Mới

**Request Body:**

```json
{
  "invoice_no": "EVN-2024-05",
  "invoice_date": "2024-05-31",
  "supplier_id": 7,
  "po_id": null,
  "total_before_tax": 18181818,
  "total_tax": 1818182,
  "total_after_tax": 20000000,
  "lines": [
    {
      "product_id": null,
      "description": "Tiền điện tháng 5/2024",
      "quantity": 1,
      "unit_price": 20000000,
      "line_total": 20000000
    }
  ]
}
```

**Response 201:**

```json
{
  "success": true,
  "message": "Tạo hóa đơn thành công",
  "data": {
    "id": 56,
    "invoice_no": "EVN-2024-05",
    "source": "manual",
    "matching_status": "pending",
    "supplier_id": 7,
    "lines": [...],
    ...
  }
}
```

**Response 409 (trùng lặp):**

```json
{
  "success": false,
  "message": "Hóa đơn đã tồn tại trong hệ thống",
  "duplicate": {
    "existingInvoiceId": 42,
    "existingInvoiceDate": "2024-04-30T00:00:00.000Z",
    "message": "Hóa đơn đã tồn tại trong hệ thống"
  }
}
```

### `getById()` — Cập Nhật

Trước đây chỉ trả về invoice data. Giờ trả về thêm:

- `matching_details` — JSON chi tiết kết quả 3-way matching
- `audit_trail` — mảng lịch sử hành động (created, override, mismatch...)

**Response mẫu:**

```json
{
  "success": true,
  "data": {
    "id": 55,
    "invoice_no": "INV-ABC-001",
    "source": "ai_ocr",
    "ocr_confidence": 0.92,
    "matching_status": "matched",
    "matching_details": {
      "summary": { "total_lines": 2, "matched_lines": 2, "price_mismatches": 0, "qty_mismatches": 0 },
      "line_results": [...]
    },
    "lines": [...],
    "audit_trail": [
      {
        "id": 1,
        "action": "created",
        "source": "ai_ocr",
        "ocr_confidence": 0.92,
        "created_by": 3,
        "created_at": "2024-05-01T08:30:00.000Z"
      }
    ]
  }
}
```

### `getAll()` — Hỗ Trợ Lọc Theo `source`

```
GET /api/ap/invoices?source=ai_ocr&status=draft
GET /api/ap/invoices?source=manual&approval_status=waiting_approval
```

---

## 4. Luồng Flow Giai Đoạn 4

### Luồng Tạo Thủ Công (Manual)

```
[Frontend] Kế toán điền form hóa đơn thủ công
    ↓
POST /api/ap/invoices
    ↓
apInvoiceController.createManual()
    ├─ Validate controller level (invoice_no, supplier_id, lines)
    └─ apInvoiceService.createAPInvoice({ source: 'manual', ... })
           ├─ Validate service level
           ├─ DuplicateDetector.check()
           │    └─ Nếu trùng → 409 với duplicate info
           ├─ DB Transaction: ApInvoice + Lines
           ├─ ThreeWayMatcher [async, nếu có po_id]
           ├─ AuditLog.logCreation()
           └─ Return invoice
    ↓
Response 201: { success: true, data: invoice }
```

### Luồng Xem Chi Tiết Invoice

```
GET /api/ap/invoices/55
    ↓
apInvoiceController.getById()
    ├─ apInvoiceService.getById(55, user)
    │    └─ Include: lines, supplier, order, branch, creator, approver
    └─ apInvoiceAuditLogService.getAuditTrail(55)
    ↓
Response: { data: { ...invoice, audit_trail: [...] } }
```

---

## 5. Ví Dụ Thực Tế

### Ví dụ 1 — Kế toán tạo hóa đơn tiền điện

```
Bối cảnh: Tháng 5, công ty nhận hóa đơn tiền điện 20 triệu từ EVN.
Không có PO vì đây là chi phí định kỳ.

Request:
POST /api/ap/invoices
{
  "invoice_no": "EVN-HCM-2024-05",
  "invoice_date": "2024-05-31",
  "supplier_id": 7,       // EVN TP.HCM
  "po_id": null,          // Không có PO
  "total_after_tax": 20000000,
  "lines": [{
    "description": "Tiền điện tháng 5/2024 - Kho B",
    "quantity": 1,
    "unit_price": 20000000
  }]
}

Kết quả:
- Invoice tạo với source='manual', matching_status='pending'
- Không chạy 3-way matching (po_id = null)
- Audit log: action='created', source='manual'
- Kế toán submit → Trưởng phòng approve → GL: Nợ TK156 / Có TK331
```

### Ví dụ 2 — Lọc danh sách invoice theo nguồn OCR

```
Trưởng phòng muốn xem tất cả invoice được tạo từ OCR trong tháng này:

GET /api/ap/invoices?source=ai_ocr&status=draft

Response: Danh sách invoice với source='ai_ocr', status='draft'
→ Có thể thấy ngay invoice nào cần review, invoice nào đã matched
```

### Ví dụ 3 — Xem audit trail của invoice

```
Compliance officer muốn kiểm tra invoice #55 được tạo như thế nào:

GET /api/ap/invoices/55

Response audit_trail:
[
  { action: 'created', source: 'ai_ocr', ocr_confidence: 0.92, created_at: '...' },
  { action: 'mismatch_accepted', matching_status: 'mismatch',
    matching_details: { qty_mismatch: [{ product_id: 5, invoice_qty: 100, remaining: 80 }] },
    created_at: '...' }
]
→ Thấy rõ: invoice tạo từ OCR, có sai lệch số lượng nhưng vẫn được chấp nhận
```

---

## 6. Điểm Cần Lưu Ý

1. **`POST /` chỉ cho ACCOUNT** — CHACC không tạo invoice, chỉ approve/reject.

2. **409 trả về `duplicate` object** — Frontend cần xử lý case này để hiển thị modal "Hóa đơn đã tồn tại, có muốn ghi đè?". Sau đó gọi lại với `overrideDuplicate: true`.

3. **`audit_trail` trong `getById()`** — Đây là dữ liệu bất biến, chỉ đọc. Không có endpoint để sửa/xóa audit log.

4. **`source` filter trong `getAll()`** — Giúp kế toán phân biệt invoice tạo thủ công vs từ OCR để quản lý dễ hơn.

5. **`from-po/:poId` vẫn hoạt động** — Không break code frontend cũ đang dùng endpoint này.

---

## 7. Giai Đoạn Tiếp Theo

**Giai Đoạn 5 — Frontend Integration** cần làm:

- Cập nhật `APInvoiceForm` hiển thị `source`, `ocr_confidence`, `matching_status`
- Cập nhật `APInvoiceList` thêm filter theo `source`, hiển thị badge OCR/Manual
- Thêm tab "Audit Trail" trong màn hình chi tiết invoice
- Hiển thị `matching_details` (3-way matching result) trong chi tiết invoice
