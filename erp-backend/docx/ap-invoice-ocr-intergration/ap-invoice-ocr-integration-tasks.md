# Danh Sách Tác Vụ: Tích Hợp AP Invoice với OCR

## Tổng Quan

Tài liệu này liệt kê tất cả các tác vụ triển khai cho tích hợp AP Invoice với OCR, được chia thành các giai đoạn:

1. **Giai Đoạn 1**: Cơ Sở Dữ Liệu & Models
2. **Giai Đoạn 2**: Dịch Vụ Cơ Bản (Matching Services)
3. **Giai Đoạn 3**: Dịch Vụ Chính (APInvoiceService, DocumentService)
4. **Giai Đoạn 4**: API Endpoints
5. **Giai Đoạn 5**: Frontend Integration
6. **Giai Đoạn 6**: Testing & Validation
7. **Giai Đoạn 7**: Báo Cáo & Phân Tích

---

## Giai Đoạn 1: Cơ Sở Dữ Liệu & Models

### 1.1 Tạo Migration cho Bảng ap_invoices

- [ ] 1.1 Tạo migration thêm các cột vào ap_invoices (source, invoice_document_id, ocr_confidence, matching_status, matching_details, supplier_id)
- [ ] 1.2 Tạo các index: idx_ap_invoices_source_created, idx_ap_invoices_invoice_no_supplier
- [ ] 1.3 Cập nhật ApInvoice model với các trường mới
- [ ] 1.4 Chạy migration và kiểm tra

### 1.2 Tạo Migration cho Bảng ap_invoice_lines

- [ ] 1.5 Tạo migration thêm các cột vào ap_invoice_lines (po_line_id, grn_line_id, matching_result)
- [ ] 1.6 Cập nhật ApInvoiceLine model với các trường mới
- [ ] 1.7 Chạy migration và kiểm tra

### 1.3 Tạo Bảng invoice_documents

- [ ] 1.8 Tạo migration tạo bảng invoice_documents với tất cả các cột
- [ ] 1.9 Tạo InvoiceDocument model
- [ ] 1.10 Tạo các index cho bảng invoice_documents
- [ ] 1.11 Chạy migration và kiểm tra

### 1.4 Tạo Bảng ap_invoice_audit_logs

- [ ] 1.12 Tạo migration tạo bảng ap_invoice_audit_logs
- [ ] 1.13 Tạo ApInvoiceAuditLog model
- [ ] 1.14 Chạy migration và kiểm tra

---

## Giai Đoạn 2: Dịch Vụ Cơ Bản (Matching Services)

### 2.1 VendorMatcherService

- [ ] 2.1 Tạo file VendorMatcherService.ts
- [ ] 2.2 Triển khai hàm levenshteinDistance()
- [ ] 2.3 Triển khai hàm calculateVendorMatchConfidence()
- [ ] 2.4 Triển khai hàm match() với exact match by tax_code
- [ ] 2.5 Triển khai fuzzy match by name
- [ ] 2.6 Viết unit tests cho VendorMatcherService
- [ ] 2.7 Kiểm tra coverage >= 80%

### 2.2 ProductMatcherService

- [ ] 2.8 Tạo file ProductMatcherService.ts
- [ ] 2.9 Triển khai hàm match() với fuzzy matching
- [ ] 2.10 Triển khai category hint prioritization
- [ ] 2.11 Triển khai hàm trả về suggestions
- [ ] 2.12 Viết unit tests cho ProductMatcherService
- [ ] 2.13 Kiểm tra coverage >= 80%

### 2.3 DuplicateDetectorService

- [ ] 2.14 Tạo file DuplicateDetectorService.ts
- [ ] 2.15 Triển khai hàm detect() với query (invoice_no, supplier_id, branch_id)
- [ ] 2.16 Triển khai logic phát hiện hóa đơn trùng lặp
- [ ] 2.17 Triển khai logic phát hiện hóa đơn muộn (> 30 ngày)
- [ ] 2.18 Viết unit tests cho DuplicateDetectorService
- [ ] 2.19 Kiểm tra coverage >= 80%

### 2.4 Cập Nhật ThreeWayMatcherService

- [ ] 2.20 Kiểm tra ThreeWayMatcherService hiện có
- [ ] 2.21 Sửa lỗi po_line_id type (thêm ? để optional)
- [ ] 2.22 Thêm unit tests cho ThreeWayMatcherService
- [ ] 2.23 Kiểm tra coverage >= 80%

---

## Giai Đoạn 3: Dịch Vụ Chính

### 3.1 OCREngineFactory & OpenAIVisionOCRService

- [ ] 3.1 Tạo file OCREngineFactory.ts
- [ ] 3.2 Triển khai factory pattern cho OCR engines
- [ ] 3.3 Cập nhật OpenAIVisionOCRService để trích xuất structured data
- [ ] 3.4 Triển khai hàm calculateFieldConfidence()
- [ ] 3.5 Triển khai hàm calculateOverallConfidence()
- [ ] 3.6 Viết unit tests cho OCREngineFactory
- [ ] 3.7 Kiểm tra coverage >= 80%

### 3.2 DocumentService

- [ ] 3.8 Tạo file DocumentService.ts
- [ ] 3.9 Triển khai hàm uploadDocument() với validation file
- [ ] 3.10 Triển khai hàm uploadToCloudinary()
- [ ] 3.11 Triển khai hàm createInvoiceDocument()
- [ ] 3.12 Triển khai hàm queueOCRJob()
- [ ] 3.13 Triển khai hàm processOCRJob() (background job)
- [ ] 3.14 Triển khai hàm getOCRResult() với enrichment
- [ ] 3.15 Triển khai hàm confirmOCRResult()
- [ ] 3.16 Triển khai error handling và retry logic
- [ ] 3.17 Viết unit tests cho DocumentService
- [ ] 3.18 Kiểm tra coverage >= 80%

### 3.3 APInvoiceService - Điểm Vào Thống Nhất

- [ ] 3.19 Tạo phương thức createAPInvoice() trong APInvoiceService
- [ ] 3.20 Triển khai Validation Phase
- [ ] 3.21 Triển khai Duplicate Detection Phase
- [ ] 3.22 Triển khai Three-Way Matching Phase
- [ ] 3.23 Triển khai Auto-Create Decision Phase
- [ ] 3.24 Triển khai Create Phase (atomic transaction)
- [ ] 3.25 Triển khai Audit Trail Phase
- [ ] 3.26 Triển khai Return Phase
- [ ] 3.27 Cập nhật createFromPO() để gọi createAPInvoice() nội bộ
- [ ] 3.28 Viết unit tests cho createAPInvoice()
- [ ] 3.29 Kiểm tra coverage >= 80%

### 3.4 APInvoiceAuditLogService

- [ ] 3.30 Tạo file APInvoiceAuditLogService.ts
- [ ] 3.31 Triển khai hàm logCreation()
- [ ] 3.32 Triển khai hàm logOverride()
- [ ] 3.33 Triển khai hàm logMismatch()
- [ ] 3.34 Triển khai hàm getAuditTrail()
- [ ] 3.35 Viết unit tests cho APInvoiceAuditLogService
- [ ] 3.36 Kiểm tra coverage >= 80%

---

## Giai Đoạn 4: API Endpoints

### 4.1 DocumentController

- [ ] 4.1 Tạo POST /api/documents/upload endpoint
- [ ] 4.2 Triển khai file validation (size, format)
- [ ] 4.3 Triển khai response với InvoiceDocument
- [ ] 4.4 Tạo GET /api/documents/:id/result endpoint
- [ ] 4.5 Triển khai enrichment logic
- [ ] 4.6 Triển khai response với EnrichedOCRResult
- [ ] 4.7 Tạo POST /api/documents/:id/confirm endpoint
- [ ] 4.8 Triển khai approval data merge
- [ ] 4.9 Triển khai response với ApInvoice đã tạo
- [ ] 4.10 Tạo GET /api/documents endpoint với lọc
- [ ] 4.11 Viết integration tests cho DocumentController
- [ ] 4.12 Kiểm tra coverage >= 80%

### 4.2 APInvoiceController - Cập Nhật

- [ ] 4.13 Cập nhật POST /api/ap-invoices endpoint để gọi createAPInvoice()
- [ ] 4.14 Cập nhật GET /api/ap-invoices/:id endpoint để trả về audit trail
- [ ] 4.15 Cập nhật GET /api/ap-invoices endpoint để hỗ trợ lọc theo source
- [ ] 4.16 Viết integration tests cho APInvoiceController
- [ ] 4.17 Kiểm tra coverage >= 80%

---

## Giai Đoạn 5: Frontend Integration

### 5.1 DocumentUploadPage Component

- [ ] 5.1 Tạo DocumentUploadPage component
- [ ] 5.2 Triển khai file upload form
- [ ] 5.3 Triển khai file validation UI
- [ ] 5.4 Triển khai progress indicator
- [ ] 5.5 Triển khai error handling UI
- [ ] 5.6 Viết component tests

### 5.2 OCRResultReviewPanel Component

- [ ] 5.7 Tạo OCRResultReviewPanel component
- [ ] 5.8 Triển khai hiển thị OCR result
- [ ] 5.9 Triển khai vendor/product matching display
- [ ] 5.10 Triển khai duplicate detection warning
- [ ] 5.11 Triển khai three-way matching display
- [ ] 5.12 Triển khai auto-create readiness indicator
- [ ] 5.13 Triển khai manual review form
- [ ] 5.14 Triển khai confirm button
- [ ] 5.15 Viết component tests

### 5.3 APInvoiceForm Component - Cập Nhật

- [ ] 5.16 Cập nhật APInvoiceForm để hỗ trợ source field
- [ ] 5.17 Cập nhật form để hiển thị audit trail
- [ ] 5.18 Cập nhật form để hiển thị matching results
- [ ] 5.19 Viết component tests

### 5.4 APInvoiceList Component - Cập Nhật

- [ ] 5.20 Cập nhật APInvoiceList để hỗ trợ lọc theo source
- [ ] 5.21 Cập nhật list để hiển thị OCR confidence
- [ ] 5.22 Cập nhật list để hiển thị matching status
- [ ] 5.23 Viết component tests

---

## Giai Đoạn 6: Testing & Validation

### 6.1 Property-Based Testing

- [ ] 6.1 Tạo file threeWayMatching.properties.test.ts
- [ ] 6.2 Viết property test cho three-way matching logic
- [ ] 6.3 Viết property test cho duplicate detection
- [ ] 6.4 Viết property test cho vendor matching
- [ ] 6.5 Viết property test cho product matching
- [ ] 6.6 Chạy property tests và kiểm tra coverage

### 6.2 Integration Testing

- [ ] 6.7 Tạo file apInvoiceOCRIntegration.integration.test.ts
- [ ] 6.8 Viết integration test cho OCR-to-AP Invoice flow
- [ ] 6.9 Viết integration test cho manual creation flow
- [ ] 6.10 Viết integration test cho auto-create decision
- [ ] 6.11 Viết integration test cho three-way matching
- [ ] 6.12 Viết integration test cho duplicate detection
- [ ] 6.13 Chạy integration tests

### 6.3 End-to-End Testing

- [ ] 6.14 Tạo E2E test cho upload document flow
- [ ] 6.15 Tạo E2E test cho OCR result review flow
- [ ] 6.16 Tạo E2E test cho manual creation flow
- [ ] 6.17 Tạo E2E test cho auto-create flow
- [ ] 6.18 Chạy E2E tests

### 6.4 Performance Testing

- [ ] 6.19 Kiểm tra OCR processing time (target < 25s)
- [ ] 6.20 Kiểm tra three-way matching performance
- [ ] 6.21 Kiểm tra duplicate detection performance
- [ ] 6.22 Kiểm tra database query performance

---

## Giai Đoạn 7: Báo Cáo & Phân Tích

### 7.1 OCR Processing Report

- [ ] 7.1 Tạo endpoint GET /api/reports/ocr-processing
- [ ] 7.2 Triển khai tính toán totalDocuments
- [ ] 7.3 Triển khai tính toán successfulOCR, failedOCR
- [ ] 7.4 Triển khai tính toán averageConfidence
- [ ] 7.5 Triển khai tính toán averageProcessingTimeMs
- [ ] 7.6 Triển khai tính toán autoCreatedInvoices, manualReviewRequired
- [ ] 7.7 Triển khai tính toán autoCreatePercentage

### 7.2 Three-Way Matching Report

- [ ] 7.8 Tạo endpoint GET /api/reports/three-way-matching
- [ ] 7.9 Triển khai tính toán totalInvoices, matchedInvoices
- [ ] 7.10 Triển khai tính toán invoicesWithMismatches
- [ ] 7.11 Triển khai tính toán qtyMismatchCount, priceMismatchCount
- [ ] 7.12 Triển khai tính toán topVendorsWithMismatches
- [ ] 7.13 Triển khai tính toán topProductsWithMismatches

### 7.3 Duplicate Detection Report

- [ ] 7.14 Tạo endpoint GET /api/reports/duplicate-detection
- [ ] 7.15 Triển khai tính toán duplicatesDetected
- [ ] 7.16 Triển khai tính toán topVendorsWithDuplicates
- [ ] 7.17 Triển khai tính toán timeToResolution

### 7.4 Confidence Distribution Report

- [ ] 7.18 Tạo endpoint GET /api/reports/confidence-distribution
- [ ] 7.19 Triển khai biểu đồ OCR confidence distribution
- [ ] 7.20 Triển khai biểu đồ vendor match confidence distribution
- [ ] 7.21 Triển khai biểu đồ product match confidence distribution

---

## Giai Đoạn 8: Cấu Hình & Khả Mở Rộng

### 8.1 Environment Configuration

- [ ] 8.1 Thêm OCR_ENGINE vào .env
- [ ] 8.2 Thêm OCR_MIN_CONFIDENCE_AUTO_CREATE vào .env
- [ ] 8.3 Thêm VENDOR_MATCH_MIN_CONFIDENCE vào .env
- [ ] 8.4 Thêm PRODUCT_MATCH_MIN_CONFIDENCE vào .env
- [ ] 8.5 Thêm AUTO_CREATE_WITH_MISMATCHES vào .env
- [ ] 8.6 Thêm MAX_FILE_SIZE_MB vào .env
- [ ] 8.7 Thêm OCR_TIMEOUT_SECONDS vào .env

### 8.2 Configuration Service

- [ ] 8.8 Tạo OCRConfigService
- [ ] 8.9 Triển khai hàm loadConfig()
- [ ] 8.10 Triển khai hàm validateConfig()
- [ ] 8.11 Triển khai hàm getConfig()
- [ ] 8.12 Triển khai logging config values on startup

### 8.3 Branch-Level Configuration

- [ ] 8.13 Tạo bảng branch_ocr_config
- [ ] 8.14 Triển khai hàm getConfigForBranch()
- [ ] 8.15 Triển khai hàm overrideConfigForBranch()

---

## Giai Đoạn 9: Tài Liệu & Deployment

### 9.1 API Documentation

- [ ] 9.1 Viết OpenAPI spec cho Document endpoints
- [ ] 9.2 Viết OpenAPI spec cho APInvoice endpoints
- [ ] 9.3 Viết OpenAPI spec cho Report endpoints
- [ ] 9.4 Tạo API documentation

### 9.2 Developer Documentation

- [ ] 9.5 Viết hướng dẫn setup OCR integration
- [ ] 9.6 Viết hướng dẫn cấu hình OCR engine
- [ ] 9.7 Viết hướng dẫn troubleshooting
- [ ] 9.8 Viết hướng dẫn monitoring

### 9.3 Deployment

- [ ] 9.9 Tạo migration scripts
- [ ] 9.10 Tạo rollback scripts
- [ ] 9.11 Tạo deployment checklist
- [ ] 9.12 Tạo monitoring dashboard

---

## Tóm Tắt

**Tổng Số Tác Vụ**: 150+ tác vụ

**Ước Tính Thời Gian**:

- Giai Đoạn 1 (DB & Models): 2-3 ngày
- Giai Đoạn 2 (Matching Services): 3-4 ngày
- Giai Đoạn 3 (Main Services): 4-5 ngày
- Giai Đoạn 4 (API Endpoints): 2-3 ngày
- Giai Đoạn 5 (Frontend): 3-4 ngày
- Giai Đoạn 6 (Testing): 3-4 ngày
- Giai Đoạn 7 (Reports): 2-3 ngày
- Giai Đoạn 8 (Config): 1-2 ngày
- Giai Đoạn 9 (Docs & Deploy): 2-3 ngày

**Tổng Ước Tính**: 22-31 ngày (khoảng 1 tháng)

---

## Ghi Chú

- Tất cả các tác vụ phải có unit tests với coverage >= 80%
- Tất cả các tác vụ phải tuân theo coding standards hiện có
- Tất cả các tác vụ phải được review trước khi merge
- Property-based testing bắt buộc cho các logic phức tạp
- Integration testing bắt buộc cho các flow chính
