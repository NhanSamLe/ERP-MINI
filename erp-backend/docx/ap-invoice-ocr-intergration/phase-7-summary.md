# Tóm Tắt Giai Đoạn 7 — Báo Cáo & Phân Tích

> **Trạng thái**: ✅ Hoàn thành  
> **Ngày hoàn thành**: 01/05/2026  
> **Tác vụ hoàn thành**: 7.1, 7.5, 7.6, 7.9, 7.10, 7.11, 7.12

---

## 1. Các File Đã Tạo / Sửa

| File                                                      | Loại   | Mục Đích                                         |
| --------------------------------------------------------- | ------ | ------------------------------------------------ |
| `src/modules/reports/controllers/ocrReport.controller.ts` | ✅ Mới | 4 report endpoints cho OCR & AP Invoice          |
| `src/modules/reports/routes.ts`                           | 🔄 Sửa | Thêm 4 routes mới `/reports/ocr/*`               |
| `src/modules/purchase/services/apInvoice.service.ts`      | 🔄 Fix | Sửa alias `supplier_partner` → `invoiceSupplier` |

---

## 2. Danh Sách Endpoints Báo Cáo Mới

| Endpoint                                       | Auth                       | Mô Tả                       |
| ---------------------------------------------- | -------------------------- | --------------------------- |
| `GET /api/reports/ocr/processing`              | ACCOUNT, CHACC, ADMIN, CEO | Tổng hợp xử lý OCR          |
| `GET /api/reports/ocr/three-way-matching`      | ACCOUNT, CHACC, ADMIN, CEO | Kết quả đối soát 3 chiều    |
| `GET /api/reports/ocr/duplicate-detection`     | ACCOUNT, CHACC, ADMIN, CEO | Phát hiện hóa đơn trùng lặp |
| `GET /api/reports/ocr/confidence-distribution` | ACCOUNT, CHACC, ADMIN, CEO | Phân phối độ tin cậy OCR    |

**Query params chung**: `date_from`, `date_to` (ISO string, optional)

---

## 3. Chi Tiết Từng Endpoint

### 3.1 `GET /api/reports/ocr/processing`

**Mục đích**: Tổng hợp hiệu quả xử lý OCR — bao nhiêu tài liệu được xử lý, tỷ lệ thành công, confidence trung bình, tỷ lệ tạo tự động.

**Response mẫu:**

```json
{
  "period": { "date_from": "2024-05-01", "date_to": "2024-05-31" },
  "documents": {
    "total": 150,
    "successful": 138,
    "failed": 8,
    "pending": 4,
    "success_rate": 92
  },
  "quality": {
    "average_confidence": 0.8742,
    "average_confidence_pct": 87,
    "average_processing_time_ms": 4250
  },
  "invoices": {
    "total_ocr_invoices": 138,
    "auto_created": 112,
    "manual_review_required": 26,
    "auto_create_percentage": 81
  }
}
```

**Logic tính toán:**

- `successful` = count(ocr_status = 'done')
- `failed` = count(ocr_status = 'failed')
- `average_confidence` = AVG(ocr_confidence) WHERE ocr_status = 'done'
- `auto_created` = count(source = 'ai_ocr' AND ocr_confidence >= 0.85)
- `auto_create_percentage` = auto_created / total_ocr_invoices \* 100

---

### 3.2 `GET /api/reports/ocr/three-way-matching`

**Mục đích**: Phân tích kết quả đối soát 3 chiều — tỷ lệ matched, top vendors/products hay có sai lệch.

**Response mẫu:**

```json
{
  "summary": {
    "total_invoices_with_po": 95,
    "matched": 78,
    "mismatch": 12,
    "pending": 5,
    "match_rate": 82
  },
  "mismatch_breakdown": {
    "qty_mismatch_lines": 8,
    "price_mismatch_lines": 6,
    "total_mismatch_lines": 14
  },
  "top_vendors_with_mismatches": [
    { "supplier_id": 5, "supplier_name": "Công Ty ABC", "mismatch_count": 4 },
    {
      "supplier_id": 12,
      "supplier_name": "Nhà Cung Cấp XYZ",
      "mismatch_count": 3
    }
  ],
  "top_products_with_mismatches": [
    { "product_id": 8, "product_name": "Sản phẩm A", "mismatch_count": 5 }
  ]
}
```

---

### 3.3 `GET /api/reports/ocr/duplicate-detection`

**Mục đích**: Phát hiện và phân tích hóa đơn trùng lặp — nhà cung cấp nào hay gửi trùng.

**Response mẫu:**

```json
{
  "summary": {
    "total_duplicate_groups": 3,
    "total_overridden_invoices": 5
  },
  "top_vendors_with_duplicates": [
    { "supplier_id": 7, "supplier_name": "EVN TP.HCM", "duplicate_count": 2 }
  ],
  "duplicate_details": [
    {
      "invoice_no": "EVN-2024-05",
      "supplier_id": 7,
      "count": 3,
      "first_created": "2024-05-01T08:00:00Z",
      "last_created": "2024-05-15T14:30:00Z"
    }
  ]
}
```

---

### 3.4 `GET /api/reports/ocr/confidence-distribution`

**Mục đích**: Histogram phân phối confidence — giúp đánh giá chất lượng OCR engine.

**Response mẫu:**

```json
{
  "ocr_document_confidence": {
    "total_documents": 138,
    "histogram": [
      { "range": "0-10%", "count": 0, "percentage": 0 },
      { "range": "50-60%", "count": 5, "percentage": 4 },
      { "range": "70-80%", "count": 18, "percentage": 13 },
      { "range": "80-90%", "count": 45, "percentage": 33 },
      { "range": "90-100%", "count": 70, "percentage": 51 }
    ],
    "summary": {
      "high_confidence_pct": 84,
      "medium_confidence_pct": 13,
      "low_confidence_pct": 3
    }
  }
}
```

---

## 4. Luồng Flow Báo Cáo

```
[Trưởng phòng] Vào trang báo cáo OCR
    ↓
GET /api/reports/ocr/processing?date_from=2024-05-01&date_to=2024-05-31
    ↓
ocrReportController.ocrProcessing()
    ├─ COUNT InvoiceDocument by ocr_status
    ├─ AVG ocr_confidence WHERE done
    ├─ AVG processing_time_ms WHERE done
    ├─ COUNT ApInvoice WHERE source='ai_ocr'
    └─ COUNT ApInvoice WHERE source='ai_ocr' AND confidence >= 0.85
    ↓
Response: { documents, quality, invoices }
```

---

## 5. Ví Dụ Thực Tế

### Ví dụ 1 — Trưởng phòng xem báo cáo tháng 5

```
Câu hỏi: "Tháng 5 chúng ta xử lý bao nhiêu hóa đơn OCR? Tỷ lệ tự động là bao nhiêu?"

GET /api/reports/ocr/processing?date_from=2024-05-01&date_to=2024-05-31

Kết quả:
- 150 tài liệu upload
- 138 OCR thành công (92%)
- Confidence trung bình: 87%
- 112/138 invoice tạo tự động (81%)
- 26 invoice cần review thủ công
→ Đạt mục tiêu 80% tự động hóa!
```

### Ví dụ 2 — Compliance officer kiểm tra trùng lặp

```
Câu hỏi: "Có nhà cung cấp nào hay gửi hóa đơn trùng không?"

GET /api/reports/ocr/duplicate-detection

Kết quả:
- 3 nhóm hóa đơn trùng lặp
- EVN TP.HCM: 2 lần trùng (hóa đơn tháng 4 và 5 cùng số)
→ Cần liên hệ EVN để xác nhận
```

### Ví dụ 3 — IT manager đánh giá OCR engine

```
Câu hỏi: "OCR engine hiện tại có đủ tốt không?"

GET /api/reports/ocr/confidence-distribution

Kết quả:
- 84% tài liệu có confidence >= 80% (high)
- 13% ở mức 60-80% (medium)
- 3% dưới 60% (low)
→ OCR engine hoạt động tốt, chỉ 3% cần nhập thủ công
```

### Ví dụ 4 — Kế toán trưởng xem sai lệch matching

```
Câu hỏi: "Nhà cung cấp nào hay có sai lệch giá/số lượng?"

GET /api/reports/ocr/three-way-matching

Kết quả:
- 82% invoice matched
- Công Ty ABC: 4 lần mismatch (hay lệch giá)
- Sản phẩm A: 5 lần mismatch (hay lệch số lượng)
→ Cần đàm phán lại hợp đồng với Công Ty ABC
```

---

## 6. Điểm Cần Lưu Ý

1. **Auth**: Tất cả 4 endpoints yêu cầu role ACCOUNT, CHACC, ADMIN, hoặc CEO.

2. **Date filter**: Nếu không truyền `date_from`/`date_to`, báo cáo tính toàn bộ dữ liệu của branch.

3. **`auto_created` estimate**: Tính dựa trên `ocr_confidence >= 0.85` — đây là ngưỡng mặc định. Nếu ngưỡng thay đổi trong config, con số này sẽ không chính xác 100%.

4. **Top vendors/products**: Giới hạn 5 kết quả. Có thể tăng limit nếu cần.

5. **Duplicate detection**: Chỉ tính invoice không bị cancelled. Invoice cancelled không được coi là duplicate.

6. **Fix bug**: Đã sửa alias `supplier_partner` → `invoiceSupplier` trong `apInvoice.service.ts` để khớp với associations.ts.

---

## 7. Giai Đoạn Tiếp Theo

**Giai Đoạn 8 — Cấu Hình & Khả Mở Rộng** cần làm:

- Thêm env variables còn thiếu vào `.env`
- Tạo `OCRConfigService` với loadConfig(), validateConfig()
- Logging config values on startup
