# Tài Liệu Thiết Kế: Tích Hợp AP Invoice với OCR

## 1. Tổng Quan Kiến Trúc

### 1.1 Kiến Trúc Cấp Cao

Hệ thống tích hợp AP Invoice với OCR được thiết kế theo mô hình **Layered Architecture** với các thành phần chính:

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Layer                            │
│  (DocumentUploadPage, APInvoiceForm, ReviewPanel)           │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                    API Layer                                 │
│  (DocumentController, APInvoiceController)                  │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                  Service Layer                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ APInvoiceService (Unified Entry Point)               │   │
│  │  - createAPInvoice()                                 │   │
│  │  - getAPInvoiceWithEnrichment()                      │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ DocumentService                                      │   │
│  │  - uploadDocument()                                  │   │
│  │  - getOCRResult()                                    │   │
│  │  - confirmOCRResult()                                │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ OCR Engine Services                                  │   │
│  │  - OpenAIVisionOCRService                            │   │
│  │  - OCREngineFactory                                  │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Matching Services                                    │   │
│  │  - VendorMatcherService                              │   │
│  │  - ProductMatcherService                             │   │
│  │  - DuplicateDetectorService                          │   │
│  │  - ThreeWayMatcherService                            │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                  Data Layer                                  │
│  (Models: ApInvoice, InvoiceDocument, StockMove, etc.)      │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Luồng Dữ Liệu Chính

**Luồng OCR-to-AP Invoice:**

```
Upload Document
    ↓
OCR Processing (OpenAI Vision)
    ↓
Data Enrichment (Vendor/Product Matching)
    ↓
Duplicate Detection
    ↓
Three-Way Matching (if PO exists)
    ↓
Decision: Auto-Create or Manual Review
    ↓
Create AP Invoice (via createAPInvoice)
    ↓
Audit Trail Logging
```

**Luồng Tạo Thủ Công:**

```
Manual Entry (Form)
    ↓
Validation
    ↓
Create AP Invoice (via createAPInvoice with source='manual')
    ↓
Three-Way Matching (if PO exists)
    ↓
Audit Trail Logging
```

---

## 2. Thiết Kế Cấp Dịch Vụ

### 2.1 APInvoiceService - Điểm Vào Thống Nhất

**Phương Thức Chính: `createAPInvoice()`**

```typescript
interface CreateAPInvoiceRequest {
  source: 'manual' | 'ai_ocr';
  invoice_no: string;
  invoice_date: Date;
  due_date?: Date;
  supplier_id: number;
  po_id?: number | null;
  branch_id: number;
  invoice_document_id?: number; // Required if source='ai_ocr'
  ocr_confidence?: number; // Provided if source='ai_ocr'
  lines: CreateAPInvoiceLineRequest[];
  created_by: number;
  total_before_tax?: number;
  total_tax?: number;
  total_after_tax?: number;
}

interface CreateAPInvoiceLineRequest {
  product_id: number;
  quantity: number;
  unit_price: number;
  description?: string;
  po_line_id?: number;
}

async createAPInvoice(
  request: CreateAPInvoiceRequest,
  transaction?: Transaction
): Promise<ApInvoice> {
  // 1. Validation
  // 2. Duplicate Detection
  // 3. Three-Way Matching (if po_id exists)
  // 4. Auto-Create Decision
  // 5. Create AP Invoice & Lines (atomic transaction)
  // 6. Audit Trail Logging
  // 7. Return created invoice with enriched data
}
```

**Quy Trình Chi Tiết:**

1. **Validation Phase**
   - Kiểm tra supplier_id tồn tại
   - Kiểm tra branch_id tồn tại
   - Kiểm tra invoice_no không trống
   - Kiểm tra tất cả lines có product_id hợp lệ
   - Kiểm tra tất cả lines có unit_price > 0
   - Nếu source='ai_ocr', kiểm tra invoice_document_id tồn tại

2. **Duplicate Detection Phase**
   - Gọi DuplicateDetectorService.detect(invoice_no, supplier_id, branch_id)
   - Nếu phát hiện trùng lặp:
     - Nếu source='ai_ocr': Trả về cảnh báo trong response, yêu cầu xác nhận
     - Nếu source='manual': Cho phép tiếp tục với xác nhận rõ ràng

3. **Three-Way Matching Phase** (nếu po_id tồn tại)
   - Gọi ThreeWayMatcherService.match(ap_invoice_id)
   - Lưu kết quả vào matching_status và matching_details

4. **Auto-Create Decision Phase** (chỉ cho source='ai_ocr')
   - Kiểm tra tiêu chí tạo tự động:
     - overall_confidence >= OCR_MIN_CONFIDENCE_AUTO_CREATE (default 0.85)
     - Không có hóa đơn trùng lặp
     - Vendor match confidence >= VENDOR_MATCH_MIN_CONFIDENCE (default 0.90)
     - Tất cả product match confidence >= PRODUCT_MATCH_MIN_CONFIDENCE (default 0.80)
     - Nếu po_id tồn tại: matching_status = 'matched'
   - Nếu tất cả tiêu chí đáp ứng: Tạo tự động
   - Nếu không: Yêu cầu xác nhận thủ công

5. **Create Phase** (Atomic Transaction)
   - Tạo ApInvoice record
   - Tạo ApInvoiceLine records
   - Cập nhật InvoiceDocument.purchase_invoice_id (nếu source='ai_ocr')
   - Commit transaction

6. **Audit Trail Phase**
   - Ghi nhật ký tạo với source, created_by, created_at
   - Nếu source='ai_ocr': Lưu ocr_confidence, matching_details
   - Nếu có ghi đè: Ghi nhật ký ghi đè với lý do

7. **Return Phase**
   - Trả về ApInvoice đầy đủ với:
     - Tất cả lines
     - Supplier info
     - Matching results
     - Audit trail

### 2.2 DocumentService - Xử Lý Tài Liệu OCR

**Phương Thức Chính:**

```typescript
interface UploadDocumentRequest {
  file: File;
  branch_id: number;
  created_by: number;
}

async uploadDocument(
  request: UploadDocumentRequest
): Promise<InvoiceDocument> {
  // 1. Validate file (size, format)
  // 2. Store file to Cloudinary
  // 3. Create InvoiceDocument record with ocr_status='pending'
  // 4. Queue OCR processing job
  // 5. Return InvoiceDocument
}

async getOCRResult(
  documentId: number
): Promise<EnrichedOCRResult> {
  // 1. Load InvoiceDocument
  // 2. If ocr_status != 'done': Return pending status
  // 3. If ocr_status = 'done':
  //    - Load ocr_result
  //    - Enrich with vendor/product matching
  //    - Perform duplicate detection
  //    - Perform three-way matching (if PO found)
  //    - Determine auto-create readiness
  //    - Return enriched result
}

async confirmOCRResult(
  documentId: number,
  approvedData: ApprovedOCRData,
  user: User
): Promise<ApInvoice> {
  // 1. Load InvoiceDocument
  // 2. Merge approved data with OCR result
  // 3. Call createAPInvoice with source='ai_ocr'
  // 4. Update InvoiceDocument.purchase_invoice_id
  // 5. Return created ApInvoice
}
```

**Quy Trình OCR Processing (Background Job):**

```typescript
async processOCRJob(documentId: number): Promise<void> {
  // 1. Load InvoiceDocument
  // 2. Update ocr_status = 'processing'
  // 3. Call OCR Engine (OpenAI Vision)
  // 4. Extract structured data:
  //    - invoice_no
  //    - invoice_date
  //    - vendor_name
  //    - vendor_tax_code
  //    - total
  //    - line items (product_name, quantity, unit_price)
  // 5. Calculate confidence scores for each field
  // 6. Calculate overall_confidence (weighted average)
  // 7. Store in ocr_result with confidence scores
  // 8. Update ocr_status = 'done'
  // 9. If processing fails: Update ocr_status = 'failed', retry once after 3s
}
```

### 2.3 Matching Services

#### 2.3.1 VendorMatcherService

```typescript
interface VendorMatchResult {
  matchedPartnerId: number | null;
  matchedPartnerName: string;
  matchConfidence: number;
  extractedVendorName: string;
  extractedTaxCode: string;
  suggestions?: Partner[];
}

async match(
  extractedVendorName: string,
  extractedTaxCode?: string
): Promise<VendorMatchResult> {
  // 1. Exact match by tax_code (if provided)
  // 2. Fuzzy match by name (using Levenshtein distance)
  // 3. Return best match with confidence score
  // 4. If no match found: Return suggestions
}
```

**Thuật Toán Khớp:**

- Nếu tax_code được cung cấp và khớp chính xác: confidence = 1.0
- Nếu không: Tính Levenshtein distance giữa extracted_name và partner_name
- Confidence = 1 - (distance / max_length)
- Chỉ trả về match nếu confidence >= 0.70

#### 2.3.2 ProductMatcherService

```typescript
interface ProductMatchResult {
  matchedProductId: number | null;
  matchedProductName: string;
  matchConfidence: number;
  extractedProductName: string;
  suggestions?: Product[];
}

async match(
  extractedProductName: string,
  categoryHint?: string
): Promise<ProductMatchResult> {
  // 1. Fuzzy match by name
  // 2. If category hint provided: Prioritize matches in that category
  // 3. Return best match with confidence score
}
```

#### 2.3.3 DuplicateDetectorService

```typescript
interface DuplicateDetectionResult {
  isDuplicate: boolean;
  existingInvoice?: ApInvoice;
  confidence: number;
  reason?: string;
}

async detect(
  invoice_no: string,
  supplier_id: number,
  branch_id: number,
  invoice_date?: Date
): Promise<DuplicateDetectionResult> {
  // 1. Query ap_invoices with (invoice_no, supplier_id, branch_id)
  // 2. If found and status != 'cancelled': isDuplicate = true
  // 3. If found but invoice_date > 30 days ago: Flag as potential late duplicate
  // 4. Return result
}
```

#### 2.3.4 ThreeWayMatcherService (Hiện Có)

Dịch vụ này đã được triển khai. Nó thực hiện:

- Tính total_received từ tất cả GRN cho PO
- Tính previously_invoiced từ các AP Invoice khác
- Tính remaining_to_invoice = total_received - previously_invoiced
- Kiểm tra qty_mismatch: invoice_qty > remaining_to_invoice
- Kiểm tra price_mismatch: invoice_unit_price != po_unit_price
- Lưu kết quả vào matching_status và matching_details

---

## 3. Thiết Kế Cơ Sở Dữ Liệu

### 3.1 Bảng Hiện Có - Cập Nhật

**ap_invoices** - Thêm các cột:

```sql
ALTER TABLE ap_invoices ADD COLUMN (
  source ENUM('manual', 'ai_ocr') NOT NULL DEFAULT 'manual',
  invoice_document_id BIGINT,
  ocr_confidence DECIMAL(5,4),
  matching_status ENUM('pending', 'matched', 'mismatch') NOT NULL DEFAULT 'pending',
  matching_details JSON,
  supplier_id BIGINT NOT NULL,
  FOREIGN KEY (invoice_document_id) REFERENCES invoice_documents(id)
);

CREATE INDEX idx_ap_invoices_source_created ON ap_invoices(source, created_at);
CREATE INDEX idx_ap_invoices_invoice_no_supplier ON ap_invoices(invoice_no, supplier_id, branch_id);
```

**ap_invoice_lines** - Thêm các cột:

```sql
ALTER TABLE ap_invoice_lines ADD COLUMN (
  po_line_id BIGINT,
  grn_line_id BIGINT,
  matching_result ENUM('matched', 'price_mismatch', 'qty_mismatch'),
  FOREIGN KEY (po_line_id) REFERENCES purchase_order_lines(id),
  FOREIGN KEY (grn_line_id) REFERENCES stock_move_lines(id)
);
```

### 3.2 Bảng Mới

**invoice_documents** - Lưu trữ metadata tài liệu và kết quả OCR:

```sql
CREATE TABLE invoice_documents (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  branch_id BIGINT NOT NULL,
  purchase_invoice_id BIGINT,
  original_filename VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_type ENUM('pdf', 'jpg', 'png') NOT NULL,
  file_size_bytes INT,
  ocr_status ENUM('pending', 'processing', 'done', 'failed') NOT NULL DEFAULT 'pending',
  ocr_engine ENUM('openai_vision', 'google_doc_ai') NOT NULL DEFAULT 'openai_vision',
  ocr_raw_text TEXT,
  ocr_result JSON,
  ocr_confidence DECIMAL(5,4),
  processing_time_ms INT,
  error_message TEXT,
  retry_count INT DEFAULT 0,
  created_by BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (purchase_invoice_id) REFERENCES ap_invoices(id),
  FOREIGN KEY (created_by) REFERENCES users(id),

  INDEX idx_branch_ocr_status (branch_id, ocr_status),
  INDEX idx_created_at (created_at),
  INDEX idx_purchase_invoice_id (purchase_invoice_id)
);
```

**ap_invoice_audit_logs** - Dấu vết kiểm toán:

```sql
CREATE TABLE ap_invoice_audit_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  ap_invoice_id BIGINT NOT NULL,
  action VARCHAR(50) NOT NULL,
  source VARCHAR(50),
  ocr_confidence DECIMAL(5,4),
  matching_status VARCHAR(50),
  matching_details JSON,
  override_reason TEXT,
  created_by BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (ap_invoice_id) REFERENCES ap_invoices(id),
  FOREIGN KEY (created_by) REFERENCES users(id),

  INDEX idx_ap_invoice_id (ap_invoice_id),
  INDEX idx_created_at (created_at)
);
```

---

## 4. Thiết Kế API Endpoints

### 4.1 Document Management

**POST /api/documents/upload**

- Upload tài liệu hóa đơn
- Request: multipart/form-data (file, branch_id)
- Response: InvoiceDocument (ocr_status='pending')

**GET /api/documents/:id/result**

- Lấy kết quả OCR được làm giàu
- Response: EnrichedOCRResult với vendor/product matching, duplicate detection, three-way matching

**POST /api/documents/:id/confirm**

- Xác nhận kết quả OCR và tạo AP Invoice
- Request: ApprovedOCRData (có thể ghi đè các trường)
- Response: ApInvoice đã tạo

**GET /api/documents**

- Lấy danh sách tài liệu với lọc
- Query params: branch_id, ocr_status, created_at_from, created_at_to
- Response: Danh sách InvoiceDocument

### 4.2 AP Invoice Management

**POST /api/ap-invoices**

- Tạo AP Invoice (thủ công hoặc từ OCR)
- Request: CreateAPInvoiceRequest
- Response: ApInvoice đã tạo

**GET /api/ap-invoices/:id**

- Lấy chi tiết AP Invoice
- Response: ApInvoice với lines, supplier, matching results, audit trail

**GET /api/ap-invoices**

- Lấy danh sách AP Invoice với lọc
- Query params: status, approval_status, source, created_at_from, created_at_to
- Response: Danh sách ApInvoice

---

## 5. Thiết Kế Cấp Thấp - Thuật Toán

### 5.1 Thuật Toán Quyết Định Tạo Tự Động

```typescript
function shouldAutoCreate(
  ocrResult: OCRResult,
  duplicateDetection: DuplicateDetectionResult,
  threeWayMatch: ThreeWayMatchResult,
  config: AutoCreateConfig,
): boolean {
  // Tiêu chí 1: Độ tin cậy OCR
  if (ocrResult.overall_confidence < config.minOCRConfidence) {
    return false;
  }

  // Tiêu chí 2: Không có hóa đơn trùng lặp
  if (duplicateDetection.isDuplicate) {
    return false;
  }

  // Tiêu chí 3: Vendor match confidence
  if (ocrResult.vendorMatch.matchConfidence < config.minVendorMatchConfidence) {
    return false;
  }

  // Tiêu chí 4: Tất cả product match confidence
  for (const lineMatch of ocrResult.lineMatches) {
    if (
      lineMatch.productMatch.matchConfidence < config.minProductMatchConfidence
    ) {
      return false;
    }
  }

  // Tiêu chí 5: Three-way matching (nếu PO tồn tại)
  if (ocrResult.po_id && threeWayMatch.overall_status !== "matched") {
    if (!config.allowAutoCreateWithMismatches) {
      return false;
    }
  }

  return true;
}
```

### 5.2 Thuật Toán Khớp Nhà Cung Cấp (Fuzzy Matching)

```typescript
function calculateVendorMatchConfidence(
  extractedName: string,
  partnerName: string,
): number {
  // Chuẩn hóa tên
  const normalized1 = extractedName.toLowerCase().trim();
  const normalized2 = partnerName.toLowerCase().trim();

  // Nếu khớp chính xác
  if (normalized1 === normalized2) {
    return 1.0;
  }

  // Tính Levenshtein distance
  const distance = levenshteinDistance(normalized1, normalized2);
  const maxLength = Math.max(normalized1.length, normalized2.length);

  // Confidence = 1 - (distance / maxLength)
  const confidence = 1 - distance / maxLength;

  return Math.max(0, confidence);
}

function levenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  return dp[m][n];
}
```

### 5.3 Thuật Toán Tính Độ Tin Cậy OCR Tổng Thể

```typescript
function calculateOverallConfidence(
  fieldConfidences: Record<string, number>,
  weights: Record<string, number>,
): number {
  // Trường quan trọng: invoice_no, vendor_tax_code, total, line items
  const importantFields = [
    "invoice_no",
    "vendor_tax_code",
    "total",
    "line_items",
  ];

  let totalWeight = 0;
  let weightedSum = 0;

  for (const field of importantFields) {
    const confidence = fieldConfidences[field] ?? 0;
    const weight = weights[field] ?? 1;

    weightedSum += confidence * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}
```

---

## 6. Xử Lý Lỗi và Trường Hợp Đặc Biệt

### 6.1 Xử Lý Lỗi OCR

```typescript
async function handleOCRFailure(
  documentId: number,
  error: Error,
): Promise<void> {
  const document = await InvoiceDocument.findByPk(documentId);

  if (document.retry_count < 1) {
    // Thử lại một lần sau 3 giây
    setTimeout(() => processOCRJob(documentId), 3000);
    document.retry_count += 1;
  } else {
    // Đánh dấu thất bại
    document.ocr_status = "failed";
    document.error_message = error.message;
  }

  await document.save();
}
```

### 6.2 Xử Lý Khớp Nhà Cung Cấp Thất Bại

```typescript
interface VendorMatchFailureResponse {
  matchedPartnerId: null;
  vendorSuggestion: Partner;
  createVendorUrl: string;
  allowManualSelection: true;
}
```

### 6.3 Xử Lý Khớp Sản Phẩm Thất Bại

```typescript
interface ProductMatchFailureResponse {
  matchedProductId: null;
  productSuggestions: Product[];
  allowManualSelection: true;
  needsManualSelection: true;
}
```

---

## 7. Tích Hợp với Luồng Công Việc Hiện Có

### 7.1 Tương Thích Ngược với `createFromPO()`

```typescript
// Phương thức cũ
async createFromPO(poId: number, user: User): Promise<ApInvoice> {
  // Nội bộ gọi createAPInvoice
  const po = await PurchaseOrder.findByPk(poId);

  return this.createAPInvoice({
    source: 'manual',
    po_id: poId,
    supplier_id: po.supplier_id,
    invoice_no: generateInvoiceNo(),
    invoice_date: new Date(),
    branch_id: user.branch_id,
    lines: [], // Được điền từ PO lines
    created_by: user.id
  });
}
```

### 7.2 Luồng Phê Duyệt Không Thay Đổi

- AP Invoice được tạo từ OCR hoặc thủ công đều có status='draft'
- Luồng phê duyệt, đăng GL, thanh toán không thay đổi
- Chỉ khác biệt là source và audit trail

---

## 8. Cấu Hình và Biến Môi Trường

```typescript
interface OCRConfig {
  OCR_ENGINE: "openai_vision" | "google_doc_ai"; // default: openai_vision
  OCR_MIN_CONFIDENCE_AUTO_CREATE: number; // default: 0.85
  VENDOR_MATCH_MIN_CONFIDENCE: number; // default: 0.90
  PRODUCT_MATCH_MIN_CONFIDENCE: number; // default: 0.80
  AUTO_CREATE_WITH_MISMATCHES: boolean; // default: false
  MAX_FILE_SIZE_MB: number; // default: 10
  OCR_TIMEOUT_SECONDS: number; // default: 25
  OPENAI_API_KEY: string;
  OPENAI_MODEL: string; // default: gpt-4o-mini
}
```

---

## 9. Báo Cáo và Phân Tích

### 9.1 Báo Cáo OCR Processing

```typescript
interface OCRProcessingReport {
  totalDocuments: number;
  successfulOCR: number;
  failedOCR: number;
  averageConfidence: number;
  averageProcessingTimeMs: number;
  autoCreatedInvoices: number;
  manualReviewRequired: number;
  autoCreatePercentage: number;
}
```

### 9.2 Báo Cáo Three-Way Matching

```typescript
interface ThreeWayMatchingReport {
  totalInvoices: number;
  matchedInvoices: number;
  invoicesWithMismatches: number;
  qtyMismatchCount: number;
  priceMismatchCount: number;
  topVendorsWithMismatches: VendorMismatchStats[];
  topProductsWithMismatches: ProductMismatchStats[];
}
```

---

## 10. Tóm Tắt Thiết Kế

Thiết kế này cung cấp:

1. **Kiến Trúc Rõ Ràng**: Layered architecture với các dịch vụ chuyên biệt
2. **Điểm Vào Thống Nhất**: `createAPInvoice()` xử lý cả OCR và thủ công
3. **Quyết Định Tự Động**: Tiêu chí rõ ràng cho tạo tự động vs xem xét thủ công
4. **Đối Soát 3 Chiều**: Xác thực tính nhất quán dữ liệu
5. **Xử Lý Lỗi**: Xử lý nhẹ nhàng các trường hợp đặc biệt
6. **Dấu Vết Kiểm Toán**: Theo dõi hoàn chỉnh nguồn gốc tạo
7. **Tương Thích Ngược**: Tích hợp liền mạch với luồng công việc hiện có
8. **Khả Mở Rộng**: Hỗ trợ nhiều OCR engine qua factory pattern
9. **Báo Cáo**: Khả năng hiển thị các chỉ số OCR và mẫu
