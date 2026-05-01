# Migration & Rollback Plan — AP Invoice OCR Integration

> **Phiên bản**: 1.0  
> **Ngày**: 01/05/2026  
> **Áp dụng cho**: ERP-MINI Backend

---

## 1. Danh Sách Migrations Theo Thứ Tự

Chạy theo thứ tự timestamp tăng dần:

| #   | File Migration                                              | Mô Tả                                    |
| --- | ----------------------------------------------------------- | ---------------------------------------- |
| 1   | `20260428010000-create-invoice-documents.js`                | Tạo bảng `invoice_documents`             |
| 2   | `20260428010001-create-ocr-field-mapping.js`                | Tạo bảng `ocr_field_mapping`             |
| 3   | `20260428010002-add-ocr-fields-to-ap-invoices.js`           | Thêm cột OCR vào `ap_invoices`           |
| 4   | `20260428010003-add-matching-fields-to-ap-invoice-lines.js` | Thêm cột matching vào `ap_invoice_lines` |
| 5   | `20260502000000-create-ap-invoice-audit-logs.js`            | Tạo bảng `ap_invoice_audit_logs`         |

---

## 2. Lệnh Chạy Migration

### Chạy tất cả migrations mới

```bash
# Từ thư mục erp-backend
npx sequelize-cli db:migrate

# Hoặc chạy đến một migration cụ thể
npx sequelize-cli db:migrate --to 20260502000000-create-ap-invoice-audit-logs.js
```

### Kiểm tra trạng thái migrations

```bash
npx sequelize-cli db:migrate:status
```

---

## 3. Rollback Plan

### Rollback từng bước (an toàn nhất)

```bash
# Bước 5: Rollback ap_invoice_audit_logs
npx sequelize-cli db:migrate:undo --name 20260502000000-create-ap-invoice-audit-logs.js

# Bước 4: Rollback matching fields trên ap_invoice_lines
npx sequelize-cli db:migrate:undo --name 20260428010003-add-matching-fields-to-ap-invoice-lines.js

# Bước 3: Rollback OCR fields trên ap_invoices
npx sequelize-cli db:migrate:undo --name 20260428010002-add-ocr-fields-to-ap-invoices.js

# Bước 2: Rollback ocr_field_mapping
npx sequelize-cli db:migrate:undo --name 20260428010001-create-ocr-field-mapping.js

# Bước 1: Rollback invoice_documents (cuối cùng)
npx sequelize-cli db:migrate:undo --name 20260428010000-create-invoice-documents.js
```

### Rollback toàn bộ (nguy hiểm — chỉ dùng khi cần)

```bash
# Rollback 5 migrations gần nhất
npx sequelize-cli db:migrate:undo:all --to 20260428010000-create-invoice-documents.js
```

> ⚠️ **CẢNH BÁO**: Rollback sẽ xóa tất cả dữ liệu trong các bảng mới. Backup DB trước khi rollback.

---

## 4. Backup Trước Khi Deploy

```bash
# MySQL backup
mysqldump -u root -p erp_mini3 \
  ap_invoices \
  ap_invoice_lines \
  > backup_before_ocr_migration_$(date +%Y%m%d_%H%M%S).sql

# Hoặc backup toàn bộ DB
mysqldump -u root -p erp_mini3 > full_backup_$(date +%Y%m%d_%H%M%S).sql
```

---

## 5. Kiểm Tra Sau Migration

```sql
-- Kiểm tra bảng mới đã tồn tại
SHOW TABLES LIKE 'invoice_documents';
SHOW TABLES LIKE 'ap_invoice_audit_logs';

-- Kiểm tra cột mới trên ap_invoices
DESCRIBE ap_invoices;
-- Phải có: source, invoice_document_id, ocr_confidence, matching_status, matching_details, supplier_id

-- Kiểm tra cột mới trên ap_invoice_lines
DESCRIBE ap_invoice_lines;
-- Phải có: po_line_id, grn_line_id, matching_result

-- Kiểm tra dữ liệu cũ không bị ảnh hưởng
SELECT COUNT(*) FROM ap_invoices WHERE source = 'manual';
-- Phải bằng tổng số invoice trước khi migrate
```

---

## 6. Kế Hoạch Rollback Khẩn Cấp

Nếu phát hiện lỗi sau khi deploy production:

1. **Ngay lập tức**: Thông báo team, tắt tính năng OCR (set `OCR_ENGINE=disabled` nếu có)
2. **Trong 15 phút**: Restore backup DB nếu có dữ liệu bị corrupt
3. **Trong 30 phút**: Rollback code về commit trước
4. **Trong 1 giờ**: Rollback migrations nếu cần
5. **Sau khi ổn định**: Phân tích nguyên nhân và fix

---

## 7. Checklist Trước Khi Deploy

- [ ] Backup database production
- [ ] Chạy migrations trên staging trước
- [ ] Kiểm tra tất cả tests pass
- [ ] Kiểm tra env variables đã được set đúng
- [ ] Thông báo team về thời gian deploy
- [ ] Chuẩn bị rollback script sẵn sàng
