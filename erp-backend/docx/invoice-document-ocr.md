# Tài Liệu Yêu Cầu — AI Document Intelligence (OCR Hóa Đơn)

## Giới Thiệu

Tính năng **AI Document Intelligence** (Plan C — OCR Hóa Đơn) là một module mới trong hệ thống ERP-MINI, cho phép bộ phận kế toán upload hóa đơn nhà cung cấp dưới dạng PDF hoặc ảnh, sau đó hệ thống tự động:

1. Trích xuất dữ liệu bằng AI OCR (GPT-4o-mini Vision — Phase 1).
2. Đối chiếu thông minh với Purchase Order (PO) và Goods Receipt Note (GRN — phiếu nhập kho `stock_moves` loại `receipt`).
3. Phát hiện hóa đơn trùng lặp tự động.
4. Thực hiện 3-Way Matching (Invoice ↔ PO ↔ GRN) và cảnh báo khi có sai lệch.
5. Pre-fill form tạo AP Invoice với dữ liệu đã trích xuất, giảm thời gian nhập liệu từ 5–10 phút xuống còn 1–2 phút.

Module này tích hợp trực tiếp vào luồng tạo AP Invoice hiện có của ERP-MINI (Node.js / TypeScript / Sequelize / PostgreSQL), bổ sung các trường mới vào bảng `ap_invoices` và `ap_invoice_lines`, đồng thời tạo hai bảng mới: `invoice_documents` và `ocr_field_mapping`.

---

## Bảng Thuật Ngữ (Glossary)

- **OCR_Engine**: Thành phần AI chịu trách nhiệm trích xuất văn bản và dữ liệu có cấu trúc từ file hóa đơn. Phase 1 sử dụng GPT-4o-mini Vision API.
- **Invoice_Parser**: Thành phần phân tích kết quả thô từ OCR_Engine, chuẩn hóa thành cấu trúc dữ liệu nội bộ (`OcrInvoiceData`) và tính điểm tin cậy (`confidence`) cho từng trường.
- **Vendor_Matcher**: Thành phần so khớp tên nhà cung cấp trích xuất từ OCR với bảng `partners` trong DB, sử dụng thuật toán fuzzy matching (Levenshtein distance + LIKE query).
- **Product_Matcher**: Thành phần so khớp tên sản phẩm trên hóa đơn với bảng `products` trong DB, sử dụng fuzzy matching.
- **Duplicate_Detector**: Thành phần kiểm tra xem cặp (`invoice_no`, `supplier_id`, `branch_id`) đã tồn tại trong bảng `ap_invoices` chưa.
- **Three_Way_Matcher**: Thành phần thực hiện đối soát 3 chiều: Invoice ↔ PO ↔ GRN, kiểm tra đơn giá, số lượng đợt này và số lượng lũy kế.
- **Invoice_Document**: Bản ghi trong bảng `invoice_documents` lưu trữ metadata file upload, trạng thái OCR và kết quả OCR dạng JSON.
- **AP_Invoice**: Hóa đơn mua hàng (Accounts Payable Invoice) trong bảng `ap_invoices`.
- **AP_Invoice_Line**: Dòng chi tiết hàng hóa trong bảng `ap_invoice_lines`.
- **PO**: Purchase Order — Đơn đặt hàng trong bảng `purchase_orders`.
- **PO_Line**: Dòng chi tiết trong đơn đặt hàng, bảng `purchase_order_lines`.
- **GRN**: Goods Receipt Note — Phiếu nhập kho, tương ứng với bản ghi `stock_moves` có `type = 'receipt'` và `reference_type = 'purchase_order'`.
- **GRN_Line**: Dòng chi tiết trong phiếu nhập kho, bảng `stock_move_lines`.
- **Confidence_Score**: Điểm tin cậy từ 0.0 đến 1.0 thể hiện mức độ chắc chắn của AI khi trích xuất một trường dữ liệu.
- **Three_Way_Match_Result**: Kết quả đối soát 3 chiều, bao gồm trạng thái (`matched` / `mismatch`) và danh sách sai lệch theo từng dòng sản phẩm.
- **OCR_Field_Mapping**: Bản ghi học máy lưu ánh xạ giữa nhãn trên hóa đơn (VD: "MST:") và tên trường nội bộ (VD: `tax_code`), giúp cải thiện độ chính xác theo thời gian.
- **Document_Intelligence_Module**: Toàn bộ module backend tại `src/modules/document-intelligence/`.
- **Pre_Fill**: Hành động điền trước dữ liệu vào form tạo AP Invoice dựa trên kết quả OCR.
- **Partial_Delivery**: Tình huống nhà cung cấp giao hàng nhiều đợt cho một PO, mỗi đợt có một GRN riêng.

---

## Yêu Cầu

---

### Yêu Cầu 1: Upload và Lưu Trữ File Hóa Đơn

**User Story:** Là kế toán viên, tôi muốn upload file hóa đơn PDF hoặc ảnh lên hệ thống, để hệ thống có thể xử lý OCR và lưu trữ file gốc phục vụ tra cứu sau này.

#### Tiêu Chí Chấp Nhận

1. THE Document_Intelligence_Module SHALL chấp nhận file upload theo định dạng PDF, JPG, JPEG và PNG thông qua endpoint `POST /api/documents/upload`.
2. THE Document_Intelligence_Module SHALL từ chối file có kích thước vượt quá 10MB và trả về HTTP 400 kèm thông báo lỗi rõ ràng bằng tiếng Việt.
3. THE Document_Intelligence_Module SHALL từ chối file có định dạng không thuộc danh sách cho phép (PDF, JPG, JPEG, PNG) và trả về HTTP 400 kèm thông báo lỗi.
4. WHEN một file hợp lệ được upload, THE Document_Intelligence_Module SHALL lưu file vào thư mục `uploads/invoices/{branch_id}/{uuid}.{ext}` trên server.
5. WHEN một file hợp lệ được upload, THE Document_Intelligence_Module SHALL tạo một bản ghi `Invoice_Document` trong bảng `invoice_documents` với `ocr_status = 'pending'` và trả về `{ documentId, status: 'processing' }` trong vòng 2 giây.
6. THE Document_Intelligence_Module SHALL lưu `original_filename`, `file_type`, `branch_id`, `created_by` vào bản ghi `Invoice_Document` tại thời điểm upload.
7. WHEN upload thành công, THE Document_Intelligence_Module SHALL bắt đầu xử lý OCR bất đồng bộ (non-blocking) ngay sau khi trả về response cho client.

---

### Yêu Cầu 2: Trích Xuất Dữ Liệu Bằng AI OCR (Phase 1 — GPT-4o-mini Vision)

**User Story:** Là kế toán viên, tôi muốn hệ thống tự động đọc và trích xuất thông tin từ hóa đơn, để tôi không phải gõ tay từng trường dữ liệu vào form.

#### Tiêu Chí Chấp Nhận

1. WHEN `ocr_status = 'pending'`, THE OCR_Engine SHALL đọc file từ đường dẫn lưu trữ, chuyển đổi sang base64 và gửi đến GPT-4o-mini Vision API.
2. THE OCR_Engine SHALL trích xuất tối thiểu các trường sau từ hóa đơn: `vendor_name`, `vendor_tax_code`, `invoice_no`, `invoice_series`, `invoice_template`, `invoice_date`, `items[]` (bao gồm `name`, `qty`, `unit`, `unit_price`, `tax_rate`, `amount`), `subtotal`, `tax_amount`, `total`.
3. THE Invoice_Parser SHALL tính `confidence` riêng cho từng trường dữ liệu trích xuất, với giá trị trong khoảng [0.0, 1.0].
4. THE Invoice_Parser SHALL tính `overall_confidence` là trung bình có trọng số của confidence các trường quan trọng (`invoice_no`, `vendor_tax_code`, `total`, các dòng `items`).
5. WHEN OCR hoàn thành thành công, THE Document_Intelligence_Module SHALL cập nhật bản ghi `Invoice_Document` với `ocr_status = 'done'`, `ocr_result` (JSON), `ocr_confidence`, `processing_time_ms`.
6. IF OCR_Engine nhận được lỗi từ GPT-4o-mini API hoặc response không parse được thành JSON hợp lệ, THEN THE Document_Intelligence_Module SHALL retry đúng 1 lần sau 3 giây.
7. IF sau khi retry vẫn thất bại, THEN THE Document_Intelligence_Module SHALL cập nhật `ocr_status = 'failed'` và lưu thông tin lỗi vào `ocr_raw_text`.
8. WHILE `ocr_status = 'processing'`, THE Document_Intelligence_Module SHALL trả về `{ status: 'processing', progress: <số nguyên 0-100> }` khi client gọi `GET /api/documents/:id/status`.
9. WHEN `ocr_status = 'done'`, THE Document_Intelligence_Module SHALL trả về `{ status: 'done', confidence, fieldsExtracted, fieldsTotal, warnings[] }` khi client gọi `GET /api/documents/:id/status`.
10. WHERE hóa đơn có nhiều trang (PDF nhiều trang), THE OCR_Engine SHALL gộp nội dung tất cả các trang và xử lý như một tài liệu thống nhất.
11. IF `overall_confidence < 0.70`, THEN THE Document_Intelligence_Module SHALL thêm cảnh báo `"Chất lượng hóa đơn thấp, vui lòng kiểm tra lại toàn bộ thông tin"` vào mảng `warnings[]` trong kết quả.

---

### Yêu Cầu 3: Polling Trạng Thái OCR

**User Story:** Là kế toán viên, tôi muốn theo dõi tiến trình xử lý OCR theo thời gian thực, để biết khi nào kết quả sẵn sàng mà không cần tải lại trang.

#### Tiêu Chí Chấp Nhận

1. THE Document_Intelligence_Module SHALL cung cấp endpoint `GET /api/documents/:id/status` trả về trạng thái hiện tại của `Invoice_Document`.
2. THE Document_Intelligence_Module SHALL trả về HTTP 404 nếu `documentId` không tồn tại hoặc không thuộc `branch_id` của người dùng hiện tại.
3. THE Document_Intelligence_Module SHALL trả về HTTP 403 nếu người dùng không có quyền truy cập `Invoice_Document` thuộc `branch_id` khác.
4. WHEN `ocr_status = 'done'`, THE Document_Intelligence_Module SHALL bao gồm `confidence`, `fieldsExtracted`, `fieldsTotal` và `warnings[]` trong response của endpoint status.
5. WHEN `ocr_status = 'failed'`, THE Document_Intelligence_Module SHALL trả về `{ status: 'failed', message: "Không thể xử lý OCR. Vui lòng nhập liệu thủ công." }`.
6. THE Document_Intelligence_Module SHALL hoàn thành xử lý OCR và cập nhật trạng thái trong vòng 30 giây kể từ khi bắt đầu xử lý trong điều kiện bình thường.

---

### Yêu Cầu 4: Lấy Kết Quả OCR và Pre-fill Form

**User Story:** Là kế toán viên, tôi muốn xem kết quả OCR đã được làm giàu (enriched) với thông tin từ DB, để form tạo hóa đơn được điền sẵn và tôi chỉ cần kiểm tra các trường cần chú ý.

#### Tiêu Chí Chấp Nhận

1. THE Document_Intelligence_Module SHALL cung cấp endpoint `GET /api/documents/:id/result` trả về kết quả OCR đầy đủ sau khi `ocr_status = 'done'`.
2. WHEN `GET /api/documents/:id/result` được gọi, THE Vendor_Matcher SHALL thực hiện so khớp `vendor_name` và `vendor_tax_code` từ OCR với bảng `partners` và trả về `matchedPartnerId` cùng `matchConfidence`.
3. WHEN `GET /api/documents/:id/result` được gọi, THE Product_Matcher SHALL thực hiện so khớp từng `item.name` trong `ocr_result.items[]` với bảng `products` và trả về `matchedProductId` cùng `matchConfidence` cho từng dòng.
4. THE Vendor_Matcher SHALL ưu tiên so khớp chính xác theo `vendor_tax_code` trước, sau đó mới dùng fuzzy matching theo `vendor_name` nếu không tìm thấy kết quả chính xác.
5. THE Vendor_Matcher SHALL trả về `matchedPartnerId = null` và `matchConfidence = 0` nếu không tìm thấy nhà cung cấp phù hợp, kèm `suggestion` là tên gần nhất tìm được.
6. THE Product_Matcher SHALL trả về `matchedProductId = null` nếu không tìm thấy sản phẩm phù hợp, để người dùng tự chọn thủ công.
7. THE Document_Intelligence_Module SHALL bao gồm `duplicateWarning` trong response của `GET /api/documents/:id/result`, với giá trị `null` nếu không có trùng lặp, hoặc object chứa `existingInvoiceId`, `existingInvoiceDate`, `vendorName` nếu phát hiện trùng.
8. THE Document_Intelligence_Module SHALL trả về HTTP 400 nếu `ocr_status` chưa phải `'done'` khi gọi endpoint result.

---

### Yêu Cầu 5: Phát Hiện Hóa Đơn Trùng Lặp (Duplicate Detection)

**User Story:** Là kế toán viên, tôi muốn hệ thống tự động cảnh báo khi tôi cố nhập một hóa đơn đã tồn tại, để tránh thanh toán hai lần cho cùng một hóa đơn.

#### Tiêu Chí Chấp Nhận

1. THE Duplicate_Detector SHALL kiểm tra sự tồn tại của cặp (`invoice_no`, `supplier_id`, `branch_id`) trong bảng `ap_invoices` ngay sau khi OCR hoàn thành.
2. WHEN Duplicate_Detector phát hiện trùng lặp, THE Document_Intelligence_Module SHALL đưa thông tin `{ isDuplicate: true, existingInvoiceId, existingInvoiceDate, vendorName, message }` vào trường `duplicateWarning` của kết quả OCR.
3. THE Document_Intelligence_Module SHALL cung cấp endpoint `POST /api/documents/check-duplicate` nhận `{ invoice_no, supplier_id, branch_id }` và trả về kết quả kiểm tra trùng lặp tức thì.
4. WHEN `isDuplicate = true`, THE Document_Intelligence_Module SHALL vẫn cho phép người dùng tiếp tục tạo hóa đơn nếu người dùng xác nhận chủ động (override), nhưng phải ghi log hành động này.
5. THE Duplicate_Detector SHALL chỉ kiểm tra các `ap_invoices` có `status` khác `'cancelled'` khi xác định trùng lặp.
6. THE Duplicate_Detector SHALL so sánh `invoice_no` theo kiểu case-insensitive và loại bỏ khoảng trắng thừa ở đầu/cuối trước khi so sánh.

---

### Yêu Cầu 6: Đối Soát 3 Chiều — 3-Way Matching (Invoice ↔ PO ↔ GRN)

**User Story:** Là kế toán viên, tôi muốn hệ thống tự động so sánh hóa đơn với đơn đặt hàng và phiếu nhập kho, để tôi chỉ cần xử lý các trường hợp có sai lệch thay vì kiểm tra thủ công từng dòng.

#### Tiêu Chí Chấp Nhận

1. THE Three_Way_Matcher SHALL cung cấp endpoint `POST /api/matching/three-way` nhận `{ invoiceId }` và thực hiện đối soát đầy đủ.
2. THE Three_Way_Matcher SHALL lấy tất cả `stock_moves` có `type = 'receipt'`, `reference_type = 'purchase_order'`, `reference_id = po_id` và `status = 'posted'` để tính tổng số lượng đã nhận thực tế (GRN).
3. THE Three_Way_Matcher SHALL tính `total_received` cho từng `product_id` bằng cách cộng dồn `quantity` từ tất cả `stock_move_lines` thuộc các GRN liên quan đến PO.
4. THE Three_Way_Matcher SHALL tính `previously_invoiced` cho từng `product_id` bằng cách cộng dồn `quantity` từ tất cả `ap_invoice_lines` thuộc các `ap_invoices` khác cùng `po_id` và có `status` khác `'cancelled'`.
5. THE Three_Way_Matcher SHALL tính `remaining_to_invoice = total_received - previously_invoiced` cho từng sản phẩm.
6. WHEN `invoice_line.quantity > remaining_to_invoice`, THE Three_Way_Matcher SHALL đánh dấu dòng đó là `qty_mismatch` và ghi nhận `"Vượt số lượng: HĐ xuất {invoice_qty} nhưng thực nhận còn lại chỉ {remaining}"`.
7. WHEN `ABS(invoice_line.unit_price - po_line.unit_price) > 0` (sai lệch bất kỳ), THE Three_Way_Matcher SHALL đánh dấu dòng đó là `price_mismatch` và ghi nhận `"Lệch giá: HĐ={invoice_price}, PO={po_price}"`.
8. WHEN tất cả các dòng đều có `status = 'matched'`, THE Three_Way_Matcher SHALL trả về `overall_status = 'matched'`.
9. WHEN có ít nhất một dòng `price_mismatch` hoặc `qty_mismatch`, THE Three_Way_Matcher SHALL trả về `overall_status = 'mismatch'`.
10. THE Three_Way_Matcher SHALL lưu kết quả đối soát vào `ap_invoices.matching_status` và `ap_invoices.matching_details` (JSON) sau khi thực hiện.
11. THE Three_Way_Matcher SHALL lưu kết quả đối soát từng dòng vào `ap_invoice_lines.matching_result` (`matched` | `price_mismatch` | `qty_mismatch`).
12. THE Document_Intelligence_Module SHALL cung cấp endpoint `GET /api/matching/:invoiceId` trả về kết quả matching đã lưu của một AP Invoice.
13. WHERE `po_id` của AP Invoice là `null` (hóa đơn không liên kết PO), THE Three_Way_Matcher SHALL bỏ qua bước đối soát PO/GRN và trả về `overall_status = 'pending'` kèm thông báo `"Hóa đơn không liên kết PO, không thể thực hiện 3-Way Matching"`.

---

### Yêu Cầu 7: Xác Nhận và Tạo AP Invoice Từ Kết Quả OCR

**User Story:** Là kế toán viên, sau khi kiểm tra kết quả OCR và matching, tôi muốn xác nhận để hệ thống tự động tạo AP Invoice với đầy đủ thông tin, để tôi không phải nhập lại từ đầu.

#### Tiêu Chí Chấp Nhận

1. THE Document_Intelligence_Module SHALL cung cấp endpoint `POST /api/documents/:id/confirm` nhận payload chứa dữ liệu đã được người dùng review và chỉnh sửa (nếu có).
2. WHEN `POST /api/documents/:id/confirm` được gọi, THE Document_Intelligence_Module SHALL tạo một bản ghi `AP_Invoice` mới với `source = 'ai_ocr'`, `invoice_document_id = documentId`, `ocr_confidence = overall_confidence`.
3. WHEN `POST /api/documents/:id/confirm` được gọi, THE Document_Intelligence_Module SHALL tạo các bản ghi `AP_Invoice_Line` tương ứng với từng dòng sản phẩm đã xác nhận.
4. WHEN `POST /api/documents/:id/confirm` được gọi và Three_Way_Matching đã được thực hiện, THE Document_Intelligence_Module SHALL sao chép `matching_status` và `matching_details` vào bản ghi `AP_Invoice` mới tạo.
5. WHEN `POST /api/documents/:id/confirm` thành công, THE Document_Intelligence_Module SHALL cập nhật `Invoice_Document.purchase_invoice_id` trỏ đến `AP_Invoice` vừa tạo.
6. THE Document_Intelligence_Module SHALL trả về HTTP 409 nếu `Invoice_Document` đã được confirm trước đó (tức là `purchase_invoice_id` đã có giá trị).
7. WHEN `POST /api/documents/:id/confirm` được gọi với `overrideDuplicate = true`, THE Document_Intelligence_Module SHALL ghi log cảnh báo bao gồm `userId`, `documentId`, `existingInvoiceId` và timestamp.
8. THE Document_Intelligence_Module SHALL thực hiện toàn bộ thao tác tạo `AP_Invoice` và `AP_Invoice_Line` trong một database transaction duy nhất để đảm bảo tính toàn vẹn dữ liệu.

---

### Yêu Cầu 8: Nâng Cấp Schema AP Invoice và AP Invoice Line

**User Story:** Là kỹ sư phần mềm, tôi muốn bảng `ap_invoices` và `ap_invoice_lines` được bổ sung các trường cần thiết cho AI OCR và 3-Way Matching, để hệ thống có thể lưu trữ đầy đủ thông tin nguồn gốc và kết quả đối soát.

#### Tiêu Chí Chấp Nhận

1. THE Document_Intelligence_Module SHALL thêm các trường sau vào bảng `ap_invoices` thông qua Sequelize migration: `supplier_id` (BIGINT, NOT NULL), `invoice_series` (VARCHAR(20)), `invoice_template` (VARCHAR(20)), `tax_code` (VARCHAR(20)), `source` (ENUM: `manual` | `ai_ocr`, DEFAULT `manual`), `invoice_document_id` (BIGINT, FK → `invoice_documents`), `ocr_confidence` (DECIMAL(5,4)), `matching_status` (ENUM: `pending` | `matched` | `mismatch`, DEFAULT `pending`), `matching_details` (JSONB).
2. THE Document_Intelligence_Module SHALL thêm các trường sau vào bảng `ap_invoice_lines` thông qua Sequelize migration: `po_line_id` (BIGINT, FK → `purchase_order_lines`), `grn_line_id` (BIGINT, FK → `stock_move_lines`), `matching_result` (ENUM: `matched` | `price_mismatch` | `qty_mismatch`).
3. THE Document_Intelligence_Module SHALL tạo bảng `invoice_documents` với các cột: `id` (BIGINT PK), `branch_id` (BIGINT NOT NULL), `purchase_invoice_id` (BIGINT FK → `ap_invoices`, nullable), `original_filename` (VARCHAR(255)), `file_path` (VARCHAR(500)), `file_type` (ENUM: `pdf` | `jpg` | `png`), `ocr_status` (ENUM: `pending` | `processing` | `done` | `failed`, DEFAULT `pending`), `ocr_engine` (ENUM: `openai_vision` | `google_doc_ai`, DEFAULT `openai_vision`), `ocr_raw_text` (TEXT), `ocr_result` (JSONB), `ocr_confidence` (DECIMAL(5,4)), `processing_time_ms` (INTEGER), `created_by` (BIGINT NOT NULL), `created_at`, `updated_at`.
4. THE Document_Intelligence_Module SHALL tạo bảng `ocr_field_mapping` với các cột: `id` (BIGINT PK), `branch_id` (BIGINT NOT NULL), `vendor_id` (BIGINT), `field_name` (VARCHAR(50)), `ocr_label` (VARCHAR(100)), `confidence` (DECIMAL(5,4)), `sample_count` (INTEGER DEFAULT 0), `created_at`, `updated_at`.
5. THE Document_Intelligence_Module SHALL tạo index trên `invoice_documents(branch_id, ocr_status)` để tối ưu truy vấn polling.
6. THE Document_Intelligence_Module SHALL tạo index trên `ap_invoices(invoice_no, supplier_id, branch_id)` để tối ưu Duplicate_Detector.
7. WHEN migration được chạy trên database hiện có, THE Document_Intelligence_Module SHALL đặt `source = 'manual'` và `matching_status = 'pending'` cho tất cả bản ghi `ap_invoices` hiện tại.

---

### Yêu Cầu 9: Lịch Sử Tài Liệu Đã Xử Lý

**User Story:** Là kế toán viên, tôi muốn xem lại danh sách các hóa đơn đã upload và xử lý OCR, để tra cứu file gốc và trạng thái xử lý khi cần.

#### Tiêu Chí Chấp Nhận

1. THE Document_Intelligence_Module SHALL cung cấp endpoint `GET /api/documents/history` trả về danh sách `Invoice_Document` thuộc `branch_id` của người dùng hiện tại.
2. THE Document_Intelligence_Module SHALL hỗ trợ phân trang với tham số `page` (mặc định 1) và `limit` (mặc định 20, tối đa 100) cho endpoint history.
3. THE Document_Intelligence_Module SHALL hỗ trợ lọc theo `ocr_status` và `date_from`, `date_to` (theo `created_at`) cho endpoint history.
4. THE Document_Intelligence_Module SHALL trả về các trường sau cho mỗi bản ghi trong history: `id`, `original_filename`, `ocr_status`, `ocr_confidence`, `purchase_invoice_id`, `created_at`, `processing_time_ms`.
5. THE Document_Intelligence_Module SHALL sắp xếp kết quả history theo `created_at` giảm dần (mới nhất trước).

---

### Yêu Cầu 10: Bảo Mật và Phân Quyền

**User Story:** Là quản trị viên hệ thống, tôi muốn đảm bảo chỉ người dùng có quyền mới có thể upload và xem kết quả OCR, để bảo vệ dữ liệu tài chính nhạy cảm.

#### Tiêu Chí Chấp Nhận

1. THE Document_Intelligence_Module SHALL yêu cầu JWT authentication hợp lệ cho tất cả các endpoint trong module.
2. THE Document_Intelligence_Module SHALL kiểm tra `branch_id` của người dùng hiện tại khớp với `branch_id` của `Invoice_Document` trước khi trả về bất kỳ dữ liệu nào.
3. IF người dùng cố truy cập `Invoice_Document` thuộc `branch_id` khác, THEN THE Document_Intelligence_Module SHALL trả về HTTP 403 với thông báo `"Bạn không có quyền truy cập tài liệu này"`.
4. THE Document_Intelligence_Module SHALL không lưu OpenAI API key trong database hoặc trong `ocr_result` JSON.
5. THE Document_Intelligence_Module SHALL validate và sanitize `original_filename` trước khi lưu vào database để ngăn chặn path traversal attack.
6. THE Document_Intelligence_Module SHALL giới hạn tối đa 10 request upload mỗi phút cho mỗi `user_id` để ngăn chặn lạm dụng API.

---

### Yêu Cầu 11: Xử Lý Lỗi và Edge Cases

**User Story:** Là kế toán viên, tôi muốn hệ thống xử lý gracefully các tình huống bất thường (file mờ, timeout, vendor chưa có trong DB), để tôi luôn nhận được phản hồi rõ ràng và có thể tiếp tục công việc.

#### Tiêu Chí Chấp Nhận

1. IF `overall_confidence < 0.70` sau khi OCR hoàn thành, THEN THE Document_Intelligence_Module SHALL đánh dấu tất cả các trường có `confidence < 0.70` với cờ `needsReview = true` trong kết quả trả về.
2. IF Vendor_Matcher không tìm thấy nhà cung cấp phù hợp (`matchedPartnerId = null`), THEN THE Document_Intelligence_Module SHALL trả về `vendorSuggestion` chứa tên gần nhất tìm được và `createVendorUrl` để người dùng tạo mới nhanh.
3. IF Product_Matcher không tìm thấy sản phẩm phù hợp cho một dòng, THEN THE Document_Intelligence_Module SHALL để `matchedProductId = null` cho dòng đó và đánh dấu `needsManualSelection = true`.
4. IF file upload không phải là hóa đơn (OCR_Engine phát hiện nội dung không liên quan), THEN THE Document_Intelligence_Module SHALL cập nhật `ocr_status = 'failed'` và trả về thông báo `"File không phải hóa đơn hợp lệ"`.
5. IF OCR_Engine timeout sau 25 giây, THEN THE Document_Intelligence_Module SHALL retry 1 lần; nếu retry cũng timeout, THE Document_Intelligence_Module SHALL cập nhật `ocr_status = 'failed'` và thông báo `"Xử lý OCR quá thời gian. Vui lòng nhập liệu thủ công."`.
6. THE Document_Intelligence_Module SHALL trả về thông báo lỗi bằng tiếng Việt cho tất cả các lỗi có thể xảy ra trong luồng xử lý OCR và matching.
7. IF Three_Way_Matcher không tìm thấy `PO_Line` tương ứng với một `AP_Invoice_Line`, THEN THE Three_Way_Matcher SHALL đánh dấu dòng đó là `qty_mismatch` với thông báo `"Không tìm thấy dòng PO tương ứng"`.

---

### Yêu Cầu 12: Cấu Hình OCR Engine (Factory Pattern)

**User Story:** Là kỹ sư phần mềm, tôi muốn hệ thống hỗ trợ nhiều OCR engine thông qua factory pattern, để có thể chuyển đổi từ GPT-4o-mini Vision (Phase 1) sang Google Document AI (Phase 2) mà không cần thay đổi business logic.

#### Tiêu Chí Chấp Nhận

1. THE Document_Intelligence_Module SHALL triển khai `OCR_Engine` theo interface chung với method `extract(filePath: string): Promise<OcrRawResult>`.
2. THE Document_Intelligence_Module SHALL đọc biến môi trường `OCR_ENGINE` (giá trị: `openai_vision` | `google_doc_ai`) để quyết định engine nào được khởi tạo tại runtime.
3. WHEN `OCR_ENGINE = 'openai_vision'`, THE Document_Intelligence_Module SHALL sử dụng `OpenAIVisionOcr` với model `gpt-4o-mini` và `max_tokens = 1500`.
4. WHEN `OCR_ENGINE = 'google_doc_ai'`, THE Document_Intelligence_Module SHALL sử dụng `GoogleDocAiOcr` với processor được cấu hình qua biến môi trường `GOOGLE_DOCAI_PROCESSOR_ID`.
5. IF biến môi trường `OCR_ENGINE` không được đặt hoặc có giá trị không hợp lệ, THEN THE Document_Intelligence_Module SHALL mặc định sử dụng `openai_vision` và ghi log cảnh báo.
6. THE Document_Intelligence_Module SHALL lưu tên engine đã sử dụng vào trường `ocr_engine` của bản ghi `Invoice_Document`.
