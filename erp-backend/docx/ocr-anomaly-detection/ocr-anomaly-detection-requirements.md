# Tài Liệu Yêu Cầu: Hệ Thống Phát Hiện Bất Thường OCR (OCR Anomaly Detection)

## Giới Thiệu

Module OCR hiện tại (`document-intelligence`) xử lý hóa đơn AP theo quy trình: upload → processOcr → getEnrichedResult → confirmDocument. Hệ thống đã có confidence scoring cơ bản (weighted average 0.0–1.0) và cảnh báo khi `overall_confidence < 0.7`, nhưng chưa có khả năng phát hiện các bất thường về giá trị, số lượng, hành vi gian lận hay độ lệch thống kê.

Tính năng này bổ sung một lớp phân tích bất thường (Anomaly Detection Layer) vào quy trình OCR hiện tại, sử dụng các thuật toán thống kê (Z-score, IQR, Isolation Forest) và các quy tắc nghiệp vụ để phát hiện sớm các hóa đơn đáng ngờ trước khi người dùng xác nhận.

---

## Bảng Thuật Ngữ (Glossary)

- **Anomaly_Detector**: Service phát hiện bất thường, điều phối toàn bộ quá trình phân tích.
- **Statistical_Analyzer**: Thành phần thực hiện phân tích thống kê (Z-score, IQR) trên dữ liệu lịch sử.
- **Isolation_Forest**: Thuật toán học máy phát hiện outlier dựa trên cấu trúc cây quyết định ngẫu nhiên.
- **Anomaly_Result**: Kết quả phân tích bất thường, bao gồm danh sách cờ cảnh báo và điểm rủi ro tổng hợp.
- **Anomaly_Flag**: Một cờ cảnh báo cụ thể, bao gồm loại bất thường, mức độ nghiêm trọng, và mô tả.
- **Risk_Score**: Điểm rủi ro tổng hợp từ 0.0 đến 1.0, được tính từ tất cả các cờ cảnh báo.
- **Severity**: Mức độ nghiêm trọng của bất thường: `low` (thấp), `medium` (trung bình), `high` (cao), `critical` (nghiêm trọng).
- **Historical_Baseline**: Dữ liệu lịch sử từ các hóa đơn đã được xác nhận, dùng làm cơ sở so sánh.
- **Vendor_Profile**: Hồ sơ thống kê của nhà cung cấp, bao gồm phân phối giá, số lượng, và tần suất giao dịch.
- **Price_Outlier**: Đơn giá sản phẩm lệch đáng kể so với lịch sử giao dịch với cùng nhà cung cấp.
- **Quantity_Outlier**: Số lượng sản phẩm lệch đáng kể so với mẫu đặt hàng thông thường.
- **Fraud_Pattern**: Mẫu hành vi có dấu hiệu gian lận, ví dụ: hóa đơn vừa dưới ngưỡng phê duyệt, tần suất bất thường.
- **Behavioral_Anomaly**: Bất thường về hành vi giao dịch, ví dụ: nhà cung cấp mới, thời điểm bất thường.
- **Mathematical_Inconsistency**: Mâu thuẫn toán học trong hóa đơn, ví dụ: tổng dòng không khớp tổng hóa đơn.
- **OCR_Pipeline**: Quy trình xử lý OCR hiện tại: upload → processOcr → getEnrichedResult → confirmDocument.
- **InvoiceDocument**: Model lưu trữ tài liệu hóa đơn và kết quả OCR trong bảng `invoice_documents`.
- **OcrInvoiceData**: Cấu trúc dữ liệu kết quả OCR đã được parse, bao gồm các trường hóa đơn và line items.
- **Anomaly_Repository**: Thành phần lưu trữ và truy vấn kết quả phân tích bất thường trong cơ sở dữ liệu.
- **Z_Score**: Số độ lệch chuẩn của một giá trị so với giá trị trung bình của tập dữ liệu.
- **IQR**: Interquartile Range — khoảng tứ phân vị, dùng để xác định outlier bền vững với dữ liệu lệch.
- **Threshold_Config**: Cấu hình ngưỡng phát hiện bất thường, có thể tùy chỉnh theo từng branch.

---

## Yêu Cầu

### Yêu Cầu 1: Phân Tích Bất Thường Giá (Price Anomaly Detection)

**User Story:** Là kế toán viên, tôi muốn hệ thống tự động cảnh báo khi đơn giá trên hóa đơn OCR lệch bất thường so với lịch sử giao dịch, để tôi có thể phát hiện sai sót hoặc gian lận giá trước khi xác nhận.

#### Tiêu Chí Chấp Nhận

1. WHEN một hóa đơn OCR được parse thành công, THE Anomaly_Detector SHALL phân tích đơn giá của từng line item so với Historical_Baseline của cùng sản phẩm và nhà cung cấp.

2. WHEN đơn giá của một line item có Z_Score vượt quá 3.0 so với lịch sử giao dịch, THE Statistical_Analyzer SHALL tạo một Anomaly_Flag với severity `high` và mô tả độ lệch theo phần trăm.

3. WHEN đơn giá của một line item nằm ngoài khoảng [Q1 - 1.5×IQR, Q3 + 1.5×IQR] của lịch sử giao dịch, THE Statistical_Analyzer SHALL tạo một Anomaly_Flag với severity `medium`.

4. WHEN đơn giá của một line item nằm ngoài khoảng [Q1 - 3.0×IQR, Q3 + 3.0×IQR] của lịch sử giao dịch, THE Statistical_Analyzer SHALL nâng severity của Anomaly_Flag lên `critical`.

5. WHEN lịch sử giao dịch cho sản phẩm và nhà cung cấp có ít hơn 5 bản ghi, THE Statistical_Analyzer SHALL bỏ qua phân tích Z-score và IQR cho sản phẩm đó và ghi nhận lý do `insufficient_data`.

6. WHEN phân tích giá hoàn thành, THE Anomaly_Detector SHALL trả về danh sách Anomaly_Flag kèm theo giá trị trung bình lịch sử, độ lệch chuẩn, và phần trăm lệch so với giá trung bình.

---

### Yêu Cầu 2: Phân Tích Bất Thường Số Lượng (Quantity Anomaly Detection)

**User Story:** Là kế toán viên, tôi muốn hệ thống cảnh báo khi số lượng đặt hàng trên hóa đơn bất thường so với mẫu đặt hàng thông thường, để phát hiện các đơn hàng phình to bất thường hoặc nhập liệu sai.

#### Tiêu Chí Chấp Nhận

1. WHEN một hóa đơn OCR được parse thành công, THE Anomaly_Detector SHALL phân tích số lượng của từng line item so với Historical_Baseline của cùng sản phẩm và nhà cung cấp.

2. WHEN số lượng của một line item có Z_Score vượt quá 3.0 so với lịch sử đặt hàng, THE Statistical_Analyzer SHALL tạo một Anomaly_Flag với severity `medium` và mô tả độ lệch.

3. WHEN số lượng của một line item vượt quá 5 lần giá trị trung bình lịch sử của cùng sản phẩm, THE Statistical_Analyzer SHALL tạo một Anomaly_Flag với severity `high`.

4. WHEN số lượng của một line item bằng 0 hoặc âm, THE Anomaly_Detector SHALL tạo một Anomaly_Flag với severity `critical` và loại `invalid_quantity`.

5. WHEN lịch sử đặt hàng cho sản phẩm và nhà cung cấp có ít hơn 5 bản ghi, THE Statistical_Analyzer SHALL bỏ qua phân tích thống kê và ghi nhận lý do `insufficient_data`.

---

### Yêu Cầu 3: Phát Hiện Mâu Thuẫn Toán Học (Mathematical Inconsistency Detection)

**User Story:** Là kế toán viên, tôi muốn hệ thống tự động kiểm tra tính nhất quán toán học của hóa đơn, để phát hiện lỗi OCR hoặc hóa đơn bị chỉnh sửa.

#### Tiêu Chí Chấp Nhận

1. WHEN một hóa đơn OCR được parse thành công, THE Anomaly_Detector SHALL kiểm tra tổng các dòng (sum of line amounts) so với trường `subtotal` của hóa đơn.

2. WHEN chênh lệch giữa tổng các dòng và `subtotal` vượt quá 0.01 VND (sau khi làm tròn 2 chữ số thập phân), THE Anomaly_Detector SHALL tạo một Anomaly_Flag với loại `subtotal_mismatch` và severity `high`.

3. WHEN một hóa đơn OCR được parse thành công, THE Anomaly_Detector SHALL kiểm tra công thức: `subtotal + tax_amount = total`.

4. WHEN chênh lệch giữa `subtotal + tax_amount` và `total` vượt quá 0.01 VND, THE Anomaly_Detector SHALL tạo một Anomaly_Flag với loại `total_mismatch` và severity `high`.

5. WHEN một line item có `qty × unit_price` lệch so với `amount` của dòng đó quá 0.01 VND, THE Anomaly_Detector SHALL tạo một Anomaly_Flag với loại `line_amount_mismatch` và severity `medium` cho dòng đó.

6. WHEN tất cả các kiểm tra toán học đều nhất quán, THE Anomaly_Detector SHALL ghi nhận trạng thái `math_consistent: true` trong Anomaly_Result.

---

### Yêu Cầu 4: Phát Hiện Mẫu Gian Lận (Fraud Pattern Detection)

**User Story:** Là quản lý tài chính, tôi muốn hệ thống phát hiện các mẫu hành vi có dấu hiệu gian lận trên hóa đơn, để giảm thiểu rủi ro tài chính cho doanh nghiệp.

#### Tiêu Chí Chấp Nhận

1. WHEN tổng giá trị hóa đơn (`total`) nằm trong khoảng từ 95% đến 100% của ngưỡng phê duyệt tự động được cấu hình trong Threshold_Config, THE Anomaly_Detector SHALL tạo một Anomaly_Flag với loại `approval_threshold_proximity` và severity `high`.

2. WHEN cùng một nhà cung cấp gửi hơn 3 hóa đơn trong vòng 24 giờ cho cùng một branch, THE Anomaly_Detector SHALL tạo một Anomaly_Flag với loại `high_frequency_invoicing` và severity `medium`.

3. WHEN cùng một nhà cung cấp gửi hơn 10 hóa đơn trong vòng 24 giờ cho cùng một branch, THE Anomaly_Detector SHALL nâng severity của Anomaly_Flag `high_frequency_invoicing` lên `critical`.

4. WHEN một hóa đơn có tổng giá trị (`total`) bằng chính xác một số tròn (ví dụ: 10,000,000 VND, 50,000,000 VND) và không có line items chi tiết, THE Anomaly_Detector SHALL tạo một Anomaly_Flag với loại `round_number_no_detail` và severity `low`.

5. WHEN một hóa đơn có số hóa đơn (`invoice_no`) trùng với pattern của các hóa đơn đã bị từ chối trước đó trong cùng branch, THE Anomaly_Detector SHALL tạo một Anomaly_Flag với loại `rejected_pattern_match` và severity `high`.

6. WHEN một hóa đơn có ngày hóa đơn (`invoice_date`) là ngày cuối tháng hoặc cuối quý và tổng giá trị vượt quá 200% giá trị trung bình của nhà cung cấp, THE Anomaly_Detector SHALL tạo một Anomaly_Flag với loại `period_end_spike` và severity `medium`.

---

### Yêu Cầu 5: Phát Hiện Bất Thường Hành Vi (Behavioral Anomaly Detection)

**User Story:** Là quản lý tài chính, tôi muốn hệ thống nhận diện các hành vi giao dịch bất thường liên quan đến nhà cung cấp và thời điểm, để tăng cường kiểm soát nội bộ.

#### Tiêu Chí Chấp Nhận

1. WHEN một hóa đơn OCR được xử lý từ một nhà cung cấp chưa có lịch sử giao dịch nào trong branch (nhà cung cấp mới), THE Anomaly_Detector SHALL tạo một Anomaly_Flag với loại `new_vendor` và severity `low`.

2. WHEN một hóa đơn OCR được xử lý từ một nhà cung cấp không có giao dịch nào trong hơn 365 ngày, THE Anomaly_Detector SHALL tạo một Anomaly_Flag với loại `dormant_vendor_reactivation` và severity `medium`.

3. WHEN ngày hóa đơn (`invoice_date`) là ngày cuối tuần (thứ Bảy hoặc Chủ Nhật) và tổng giá trị vượt quá 10,000,000 VND, THE Anomaly_Detector SHALL tạo một Anomaly_Flag với loại `weekend_high_value` và severity `low`.

4. WHEN ngày hóa đơn (`invoice_date`) trong tương lai so với ngày xử lý OCR, THE Anomaly_Detector SHALL tạo một Anomaly_Flag với loại `future_dated_invoice` và severity `medium`.

5. WHEN ngày hóa đơn (`invoice_date`) cách ngày xử lý OCR hơn 90 ngày trong quá khứ, THE Anomaly_Detector SHALL tạo một Anomaly_Flag với loại `stale_invoice` và severity `low`.

6. WHEN một nhà cung cấp thay đổi mã số thuế (`vendor_tax_code`) so với lịch sử đã lưu trong hệ thống, THE Anomaly_Detector SHALL tạo một Anomaly_Flag với loại `vendor_tax_code_change` và severity `high`.

---

### Yêu Cầu 6: Phát Hiện Outlier Đa Chiều bằng Isolation Forest

**User Story:** Là quản lý tài chính, tôi muốn hệ thống sử dụng thuật toán học máy để phát hiện các hóa đơn bất thường theo nhiều chiều dữ liệu cùng lúc, để bắt được các trường hợp mà phân tích đơn lẻ bỏ sót.

#### Tiêu Chí Chấp Nhận

1. WHEN lịch sử giao dịch của một nhà cung cấp có ít nhất 20 hóa đơn đã xác nhận, THE Isolation_Forest SHALL phân tích hóa đơn mới theo vector đặc trưng gồm: tổng giá trị, số lượng line items, giá trị trung bình mỗi dòng, và khoảng cách ngày so với hóa đơn trước.

2. WHEN Isolation_Forest tính toán anomaly score nhỏ hơn -0.1 (ngưỡng mặc định), THE Isolation_Forest SHALL tạo một Anomaly_Flag với loại `multivariate_outlier` và severity `medium`.

3. WHEN Isolation_Forest tính toán anomaly score nhỏ hơn -0.3, THE Isolation_Forest SHALL nâng severity của Anomaly_Flag `multivariate_outlier` lên `high`.

4. WHEN lịch sử giao dịch của nhà cung cấp có ít hơn 20 hóa đơn, THE Isolation_Forest SHALL bỏ qua phân tích và ghi nhận lý do `insufficient_training_data`.

5. THE Isolation_Forest SHALL cập nhật model của từng nhà cung cấp sau mỗi 50 hóa đơn mới được xác nhận, để đảm bảo model phản ánh xu hướng giao dịch hiện tại.

---

### Yêu Cầu 7: Tính Toán Risk Score Tổng Hợp

**User Story:** Là kế toán viên, tôi muốn nhận được một điểm rủi ro tổng hợp duy nhất cho mỗi hóa đơn, để nhanh chóng ưu tiên các hóa đơn cần xem xét kỹ.

#### Tiêu Chí Chấp Nhận

1. WHEN tất cả các phân tích bất thường hoàn thành, THE Anomaly_Detector SHALL tính toán Risk_Score tổng hợp từ 0.0 đến 1.0 dựa trên tất cả các Anomaly_Flag được phát hiện.

2. THE Anomaly_Detector SHALL tính Risk_Score theo công thức trọng số: mỗi Anomaly_Flag có severity `critical` đóng góp 0.4, `high` đóng góp 0.25, `medium` đóng góp 0.1, `low` đóng góp 0.05; tổng được giới hạn tối đa ở 1.0.

3. WHEN Risk_Score lớn hơn hoặc bằng 0.7, THE Anomaly_Detector SHALL đặt trạng thái tổng hợp là `high_risk` và yêu cầu phê duyệt thủ công.

4. WHEN Risk_Score nằm trong khoảng [0.4, 0.7), THE Anomaly_Detector SHALL đặt trạng thái tổng hợp là `medium_risk` và hiển thị cảnh báo cho người dùng.

5. WHEN Risk_Score nhỏ hơn 0.4, THE Anomaly_Detector SHALL đặt trạng thái tổng hợp là `low_risk` và cho phép quy trình tiếp tục bình thường.

6. THE Anomaly_Detector SHALL bao gồm danh sách đầy đủ các Anomaly_Flag trong Anomaly_Result, kèm theo Risk_Score và trạng thái tổng hợp.

---

### Yêu Cầu 8: Tích Hợp vào OCR Pipeline

**User Story:** Là kế toán viên, tôi muốn kết quả phân tích bất thường được tự động tích hợp vào quy trình OCR hiện tại, để không phải thực hiện thêm bước thủ công nào.

#### Tiêu Chí Chấp Nhận

1. WHEN `processOcr` hoàn thành thành công và `ocr_status` chuyển sang `done`, THE OCR_Pipeline SHALL tự động gọi Anomaly_Detector để phân tích kết quả OCR.

2. WHEN Anomaly_Detector hoàn thành phân tích, THE OCR_Pipeline SHALL lưu Anomaly_Result vào trường `anomaly_result` của InvoiceDocument trong cơ sở dữ liệu.

3. WHEN `getEnrichedResult` được gọi, THE OCR_Pipeline SHALL bao gồm Anomaly_Result trong response trả về cho frontend, cùng với các thông tin hiện có (vendor_match, product_matches, duplicateWarning).

4. WHEN Anomaly_Detector gặp lỗi trong quá trình phân tích, THE OCR_Pipeline SHALL ghi log lỗi và tiếp tục quy trình OCR bình thường mà không làm gián đoạn trải nghiệm người dùng.

5. WHEN Risk_Score của một hóa đơn lớn hơn hoặc bằng 0.7, THE OCR_Pipeline SHALL thêm cảnh báo `high_risk_anomaly` vào mảng `warnings` của OcrInvoiceData.

6. THE OCR_Pipeline SHALL hoàn thành phân tích bất thường trong vòng 2000ms để không ảnh hưởng đến thời gian phản hồi tổng thể của quy trình OCR.

---

### Yêu Cầu 9: Lưu Trữ và Truy Vấn Kết Quả Bất Thường

**User Story:** Là quản lý tài chính, tôi muốn xem lịch sử các bất thường đã được phát hiện và theo dõi xu hướng theo thời gian, để cải thiện kiểm soát nội bộ.

#### Tiêu Chí Chấp Nhận

1. THE Anomaly_Repository SHALL lưu trữ Anomaly_Result cho mỗi InvoiceDocument vào bảng `invoice_anomaly_results` trong PostgreSQL, bao gồm: `document_id`, `risk_score`, `risk_level`, `flags` (JSONB), `analyzed_at`.

2. WHEN một InvoiceDocument được phân tích lại (re-analyze), THE Anomaly_Repository SHALL tạo bản ghi mới thay vì ghi đè bản ghi cũ, để giữ lịch sử phân tích.

3. THE Anomaly_Repository SHALL cung cấp API truy vấn danh sách hóa đơn có Risk_Score cao nhất trong một khoảng thời gian, với phân trang và lọc theo `risk_level`.

4. THE Anomaly_Repository SHALL cung cấp API thống kê tổng hợp theo branch: số lượng hóa đơn theo từng `risk_level`, loại Anomaly_Flag phổ biến nhất, và xu hướng Risk_Score theo tuần.

5. WHEN một hóa đơn được xác nhận (confirmDocument) bất chấp cảnh báo bất thường, THE Anomaly_Repository SHALL ghi nhận hành động `override` kèm theo `user_id` và thời điểm xác nhận.

---

### Yêu Cầu 10: Cấu Hình Ngưỡng Phát Hiện (Threshold Configuration)

**User Story:** Là quản trị viên hệ thống, tôi muốn có thể tùy chỉnh các ngưỡng phát hiện bất thường theo từng branch, để phù hợp với đặc thù kinh doanh của từng đơn vị.

#### Tiêu Chí Chấp Nhận

1. THE Threshold_Config SHALL cho phép cấu hình các tham số sau cho từng branch: ngưỡng Z-score (mặc định: 3.0), hệ số IQR (mặc định: 1.5), ngưỡng tần suất hóa đơn theo giờ (mặc định: 3), ngưỡng phê duyệt tự động (mặc định: 0 VND — tắt), và ngưỡng Risk_Score cho `high_risk` (mặc định: 0.7).

2. WHEN không có cấu hình tùy chỉnh cho một branch, THE Threshold_Config SHALL sử dụng giá trị mặc định toàn hệ thống.

3. WHEN một tham số cấu hình được cập nhật, THE Threshold_Config SHALL áp dụng giá trị mới cho tất cả các hóa đơn được phân tích sau thời điểm cập nhật, không ảnh hưởng đến kết quả phân tích đã lưu.

4. IF một tham số cấu hình có giá trị nằm ngoài khoảng hợp lệ (ví dụ: Z-score < 1.0 hoặc > 10.0), THEN THE Threshold_Config SHALL từ chối cập nhật và trả về thông báo lỗi mô tả khoảng giá trị hợp lệ.

---

### Yêu Cầu 11: Tính Nhất Quán Dữ Liệu và Round-Trip

**User Story:** Là kỹ sư phần mềm, tôi muốn đảm bảo dữ liệu Anomaly_Result được serialize và deserialize chính xác, để không mất thông tin khi lưu trữ và truy xuất.

#### Tiêu Chí Chấp Nhận

1. THE Anomaly_Result SHALL được serialize thành JSON và lưu vào cột JSONB của PostgreSQL mà không mất thông tin.

2. FOR ALL Anomaly_Result hợp lệ, quá trình serialize rồi deserialize SHALL tạo ra một đối tượng tương đương với đối tượng gốc (round-trip property).

3. THE Anomaly_Detector SHALL đảm bảo Risk_Score luôn nằm trong khoảng [0.0, 1.0] bất kể số lượng và severity của các Anomaly_Flag.

4. THE Anomaly_Detector SHALL đảm bảo danh sách Anomaly_Flag không chứa bản ghi trùng lặp cho cùng một loại bất thường trên cùng một line item.

5. WHEN Anomaly_Detector nhận đầu vào là OcrInvoiceData với danh sách items rỗng, THE Anomaly_Detector SHALL trả về Anomaly_Result hợp lệ với danh sách flags rỗng và Risk_Score bằng 0.0.

---

### Yêu Cầu 12: Hiệu Năng và Khả Năng Mở Rộng

**User Story:** Là kỹ sư phần mềm, tôi muốn hệ thống phát hiện bất thường hoạt động hiệu quả ngay cả khi khối lượng hóa đơn lớn, để không làm chậm quy trình OCR.

#### Tiêu Chí Chấp Nhận

1. THE Anomaly_Detector SHALL hoàn thành toàn bộ phân tích cho một hóa đơn có tối đa 50 line items trong vòng 2000ms, bao gồm cả truy vấn Historical_Baseline từ cơ sở dữ liệu.

2. THE Anomaly_Repository SHALL sử dụng index trên các cột `branch_id`, `document_id`, và `analyzed_at` để đảm bảo truy vấn lịch sử hoàn thành trong vòng 500ms với tập dữ liệu lên đến 100,000 bản ghi.

3. WHILE hệ thống đang xử lý nhiều hóa đơn đồng thời, THE Anomaly_Detector SHALL xử lý mỗi hóa đơn độc lập mà không gây ra race condition trên dữ liệu Historical_Baseline.

4. THE Statistical_Analyzer SHALL cache kết quả tính toán Vendor_Profile (mean, std, IQR) trong bộ nhớ với TTL 5 phút, để giảm số lần truy vấn cơ sở dữ liệu lặp lại.

5. IF truy vấn Historical_Baseline từ cơ sở dữ liệu mất hơn 1000ms, THEN THE Anomaly_Detector SHALL bỏ qua phân tích thống kê và trả về Anomaly_Result chỉ với kết quả kiểm tra toán học và quy tắc nghiệp vụ.
