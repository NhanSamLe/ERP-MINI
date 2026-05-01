# Deployment Checklist — AP Invoice OCR Integration

> **Phiên bản**: 1.0  
> **Ngày**: 01/05/2026

---

## PRE-DEPLOYMENT (Trước khi deploy)

### 1. Môi Trường & Config

- [ ] Tất cả env variables OCR đã được set trong `.env` production:
  - [ ] `OCR_ENGINE=openai_vision`
  - [ ] `OCR_MIN_CONFIDENCE_AUTO_CREATE=0.85`
  - [ ] `VENDOR_MATCH_MIN_CONFIDENCE=0.90`
  - [ ] `PRODUCT_MATCH_MIN_CONFIDENCE=0.80`
  - [ ] `AUTO_CREATE_WITH_MISMATCHES=false`
  - [ ] `MAX_FILE_SIZE_MB=10`
  - [ ] `OCR_TIMEOUT_MS=25000`
  - [ ] `LLM_API_KEY` đã được set (OpenAI API key)

- [ ] Kiểm tra API key OpenAI còn hạn và có đủ quota
- [ ] Kiểm tra thư mục `uploads/invoices/` có quyền write

### 2. Database

- [ ] Backup database production đã được thực hiện
- [ ] Migrations đã được test trên staging environment
- [ ] Kiểm tra không có migration conflict

### 3. Code

- [ ] Tất cả TypeScript compile không có lỗi (`npx tsc --noEmit`)
- [ ] Unit tests pass (`npx vitest run`)
- [ ] Code review đã được approve
- [ ] Branch đã được merge vào main/master

---

## DEPLOYMENT (Trong khi deploy)

### 4. Chạy Migrations

```bash
# 1. Backup DB trước
mysqldump -u root -p erp_mini3 > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Chạy migrations
npx sequelize-cli db:migrate

# 3. Kiểm tra status
npx sequelize-cli db:migrate:status
```

- [ ] Migration `create-invoice-documents` ✅
- [ ] Migration `create-ocr-field-mapping` ✅
- [ ] Migration `add-ocr-fields-to-ap-invoices` ✅
- [ ] Migration `add-matching-fields-to-ap-invoice-lines` ✅
- [ ] Migration `create-ap-invoice-audit-logs` ✅

### 5. Deploy Code

```bash
# Build TypeScript
npm run build

# Restart server
pm2 restart erp-backend
# hoặc
npm start
```

- [ ] Server khởi động thành công
- [ ] OCR config được log ra (kiểm tra logs)
- [ ] Không có error trong startup logs

---

## POST-DEPLOYMENT (Sau khi deploy)

### 6. Smoke Tests

- [ ] `GET /api/ap/invoices` trả về 200
- [ ] `GET /api/documents/history` trả về 200
- [ ] `GET /api/reports/ocr/processing` trả về 200
- [ ] Upload một file test nhỏ qua `POST /api/documents/upload`
- [ ] Kiểm tra OCR processing hoạt động

### 7. Kiểm Tra Database

```sql
-- Kiểm tra bảng mới
SELECT COUNT(*) FROM invoice_documents;
SELECT COUNT(*) FROM ap_invoice_audit_logs;

-- Kiểm tra dữ liệu cũ không bị ảnh hưởng
SELECT COUNT(*) FROM ap_invoices;
SELECT source, COUNT(*) FROM ap_invoices GROUP BY source;
-- Tất cả invoice cũ phải có source = 'manual'
```

- [ ] Dữ liệu cũ không bị mất
- [ ] Cột `source` của invoice cũ = 'manual'
- [ ] Cột `matching_status` của invoice cũ = 'pending'

### 8. Monitoring (24h đầu)

- [ ] Theo dõi error logs
- [ ] Theo dõi OCR processing time (target < 25s)
- [ ] Theo dõi API response time
- [ ] Kiểm tra không có memory leak

---

## ROLLBACK (Nếu cần)

```bash
# 1. Rollback code
git revert HEAD
npm run build
pm2 restart erp-backend

# 2. Rollback migrations (nếu cần)
npx sequelize-cli db:migrate:undo:all --to 20260428010000-create-invoice-documents.js

# 3. Restore backup (nếu dữ liệu bị corrupt)
mysql -u root -p erp_mini3 < backup_YYYYMMDD_HHMMSS.sql
```

---

## CONTACTS

| Vai Trò       | Liên Hệ Khi               |
| ------------- | ------------------------- |
| Backend Dev   | Lỗi API, migration issues |
| DBA           | Database issues, rollback |
| DevOps        | Server, deployment issues |
| Product Owner | Business logic questions  |
