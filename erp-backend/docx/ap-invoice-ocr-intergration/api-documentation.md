# API Documentation — AP Invoice OCR Integration

> **Base URL**: `http://localhost:8888/api`  
> **Auth**: JWT Bearer Token (header: `Authorization: Bearer <token>`)  
> **Phiên bản**: 1.0 | **Ngày**: 01/05/2026

---

## 1. Document Intelligence API

### 1.1 Upload Tài Liệu Hóa Đơn

```
POST /api/documents/upload
```

**Auth**: ACCOUNT, CHACC, ADMIN (và các role khác)  
**Content-Type**: `multipart/form-data`

**Request Body**:
| Field | Type | Required | Mô Tả |
|-------|------|----------|-------|
| `file` | File | ✅ | PDF, JPG, JPEG, PNG. Tối đa 10MB |

**Response 200**:

```json
{
  "documentId": 42,
  "status": "processing"
}
```

**Errors**:

- `400` — File không hợp lệ (sai định dạng hoặc quá lớn)
- `429` — Rate limit exceeded

---

### 1.2 Kiểm Tra Trạng Thái OCR

```
GET /api/documents/:id/status
```

**Response 200**:

```json
{
  "status": "done",
  "confidence": 0.92,
  "fieldsExtracted": 8,
  "fieldsTotal": 10,
  "warnings": []
}
```

**Status values**: `pending` | `processing` | `done` | `failed`

---

### 1.3 Lấy Kết Quả OCR Đã Làm Giàu

```
GET /api/documents/:id/result
```

**Response 200**:

```json
{
  "document": {
    "id": 42,
    "original_filename": "hoadon_abc.pdf",
    "ocr_status": "done",
    "ocr_confidence": 0.92,
    "ocr_result": {
      "vendor_name": "Công Ty ABC",
      "vendor_tax_code": "0123456789",
      "invoice_no": "INV-ABC-001",
      "invoice_date": "01/05/2024",
      "items": [
        {
          "name": "Sản phẩm A",
          "qty": 100,
          "unit_price": 500000,
          "amount": 50000000
        }
      ],
      "subtotal": 50000000,
      "tax_amount": 5000000,
      "total": 55000000,
      "overall_confidence": 0.92
    }
  },
  "vendor_match": {
    "matchedPartnerId": 5,
    "matchConfidence": 0.98,
    "matchMethod": "exact_tax_code"
  },
  "product_matches": [
    {
      "lineIndex": 0,
      "matchedProductId": 8,
      "matchConfidence": 0.85,
      "matchMethod": "fuzzy_name"
    }
  ],
  "duplicateWarning": null
}
```

---

### 1.4 Xác Nhận Kết Quả OCR → Tạo AP Invoice

```
POST /api/documents/:id/confirm
```

**Request Body**:

```json
{
  "vendor_id": 5,
  "po_id": 88,
  "overrideDuplicate": false,
  "items": [
    {
      "product_id": 8,
      "description": "Sản phẩm A",
      "quantity": 100,
      "unit_price": 500000
    }
  ]
}
```

**Response 201**:

```json
{
  "purchase_invoice_id": 55
}
```

**Errors**:

- `400` — OCR chưa hoàn thành
- `403` — Không có quyền truy cập tài liệu
- `409` — Tài liệu đã được xác nhận / Hóa đơn trùng lặp

---

### 1.5 Lịch Sử Tài Liệu OCR

```
GET /api/documents/history?page=1&limit=20&ocr_status=done&date_from=2024-05-01&date_to=2024-05-31
```

**Response 200**:

```json
{
  "data": [...],
  "pagination": { "page": 1, "limit": 20, "total": 150, "totalPages": 8 }
}
```

---

### 1.6 Gợi Ý PO Cho Nhà Cung Cấp

```
GET /api/documents/po-suggestions?supplier_id=5
```

**Response 200**:

```json
{
  "data": [
    {
      "id": 88,
      "po_no": "PO-2024-001",
      "total_after_tax": 55000000,
      "status": "confirmed"
    }
  ]
}
```

---

## 2. AP Invoice API

### 2.1 Lấy Danh Sách AP Invoice

```
GET /api/ap/invoices?status=draft&source=ai_ocr&approval_status=waiting_approval
```

**Query Params**:
| Param | Type | Mô Tả |
|-------|------|-------|
| `status` | string | `draft` \| `posted` \| `paid` \| `cancelled` |
| `approval_status` | string | `draft` \| `waiting_approval` \| `approved` \| `rejected` |
| `source` | string | `manual` \| `ai_ocr` — **Mới** |

**Response 200**:

```json
{
  "success": true,
  "data": [
    {
      "id": 55,
      "invoice_no": "INV-ABC-001",
      "source": "ai_ocr",
      "ocr_confidence": 0.92,
      "matching_status": "matched",
      "total_after_tax": "55000000.00",
      "status": "draft",
      "approval_status": "draft"
    }
  ]
}
```

---

### 2.2 Chi Tiết AP Invoice (kèm Audit Trail)

```
GET /api/ap/invoices/:id
```

**Response 200**:

```json
{
  "success": true,
  "data": {
    "id": 55,
    "invoice_no": "INV-ABC-001",
    "source": "ai_ocr",
    "ocr_confidence": 0.92,
    "invoice_document_id": 42,
    "matching_status": "matched",
    "matching_details": {
      "summary": { "total_lines": 1, "matched_lines": 1, "price_mismatches": 0, "qty_mismatches": 0 },
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

---

### 2.3 Tạo AP Invoice Thủ Công

```
POST /api/ap/invoices
```

**Auth**: ACCOUNT only

**Request Body**:

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
      "unit_price": 20000000
    }
  ],
  "overrideDuplicate": false
}
```

**Response 201**:

```json
{
  "success": true,
  "message": "Tạo hóa đơn thành công",
  "data": { "id": 56, "source": "manual", "matching_status": "pending", ... }
}
```

**Response 409 (Trùng lặp)**:

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

---

### 2.4 Tạo AP Invoice Từ PO

```
POST /api/ap/invoices/from-po/:poId
```

**Auth**: ACCOUNT only

**Response 201**: AP Invoice object

---

### 2.5 Submit Phê Duyệt

```
POST /api/ap/invoices/:id/submit
```

### 2.6 Phê Duyệt

```
PUT /api/ap/invoices/:id/approve
```

**Auth**: CHACC only

### 2.7 Từ Chối

```
PUT /api/ap/invoices/:id/reject
```

**Auth**: CHACC only

**Request Body**: `{ "reason": "Lý do từ chối" }`

---

## 3. Matching API

### 3.1 Chạy 3-Way Matching Thủ Công

```
POST /api/matching/three-way
```

**Request Body**: `{ "invoiceId": 55 }`

**Response 200**:

```json
{
  "overall_status": "matched",
  "line_results": [...],
  "summary": { "total_lines": 1, "matched_lines": 1, "price_mismatches": 0, "qty_mismatches": 0 }
}
```

### 3.2 Lấy Kết Quả Matching

```
GET /api/matching/:invoiceId
```

---

## 4. Report API

### 4.1 Báo Cáo OCR Processing

```
GET /api/reports/ocr/processing?date_from=2024-05-01&date_to=2024-05-31
```

**Response 200**:

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

### 4.2 Báo Cáo 3-Way Matching

```
GET /api/reports/ocr/three-way-matching?date_from=2024-05-01&date_to=2024-05-31
```

### 4.3 Báo Cáo Duplicate Detection

```
GET /api/reports/ocr/duplicate-detection?date_from=2024-05-01&date_to=2024-05-31
```

### 4.4 Báo Cáo Confidence Distribution

```
GET /api/reports/ocr/confidence-distribution?date_from=2024-05-01&date_to=2024-05-31
```

---

## 5. Error Codes

| HTTP Code | Mô Tả                                      |
| --------- | ------------------------------------------ |
| `400`     | Bad Request — Dữ liệu đầu vào không hợp lệ |
| `401`     | Unauthorized — Chưa đăng nhập              |
| `403`     | Forbidden — Không có quyền                 |
| `404`     | Not Found — Không tìm thấy resource        |
| `409`     | Conflict — Trùng lặp (hóa đơn đã tồn tại)  |
| `429`     | Too Many Requests — Rate limit             |
| `500`     | Internal Server Error                      |

---

## 6. Luồng Tích Hợp Điển Hình

### Luồng OCR (Frontend → Backend)

```
1. POST /api/documents/upload          → { documentId: 42, status: "processing" }
2. GET  /api/documents/42/status       → { status: "done", confidence: 0.92 }
3. GET  /api/documents/42/result       → { vendor_match, product_matches, ... }
4. GET  /api/documents/po-suggestions?supplier_id=5  → [{ id: 88, po_no: "PO-001" }]
5. POST /api/documents/42/confirm      → { purchase_invoice_id: 55 }
6. GET  /api/ap/invoices/55            → Invoice đầy đủ với audit trail
```

### Luồng Thủ Công

```
1. POST /api/ap/invoices               → { id: 56, source: "manual" }
2. POST /api/ap/invoices/56/submit     → Invoice với approval_status = "waiting_approval"
3. PUT  /api/ap/invoices/56/approve    → Invoice với status = "posted"
```
