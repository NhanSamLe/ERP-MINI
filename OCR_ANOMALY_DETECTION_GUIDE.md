# Hướng Dẫn Vận Hành & Thiết Kế Kỹ Thuật: OCR Anomaly Detection Pipeline (ERP Mini)

Tài liệu này mô tả chi tiết cơ chế hoạt động, kiến trúc phần mềm, thuật toán thống kê, học máy và cơ chế kiểm toán của hệ thống **Phát hiện Bất thường Hóa đơn OCR** (`ocr-anomaly-detection`) trong phân hệ **Document Intelligence**.

---

## 1. Tổng Quan Kiến Trúc Pipeline

Hệ thống phát hiện bất thường chạy ngay sau khi quá trình OCR hoàn tất thành công. Toàn bộ quá trình được điều phối bởi [anomalyDetector.service.ts](file:///d:/WorkSpace/TLCN/ERP-MINI/erp-backend/src/modules/document-intelligence/services/anomaly/anomalyDetector.service.ts) và được giới hạn thời gian (timeout) tối đa là **2000ms** để tránh tắc nghẽn hệ thống.

### Sơ đồ luồng xử lý (Pipeline Flow Diagram)

```text
       [Dữ liệu OCR thô (JSON)]
                  │
                  ▼
   [Điều phối: AnomalyDetectorService]
                  │
     ┌────────────┼────────────┬────────────┬────────────┐
     │ (Đồng bộ)  │ (Async)    │ (Async)    │ (Async)    │ (Async)
     ▼            ▼            ▼            ▼            ▼
 ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
 │   Math   │ │  Stats   │ │  Fraud   │ │ Behavior │ │Isolation │
 │ Checker  │ │ Analyzer │ │ Detector │ │ Detector │ │  Forest  │
 └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘
      │            │            │            │            │
      └────────────┼────────────┴────────────┼────────────┘
                   │ (Tổng hợp danh sách cờ lỗi - Flags)
                   ▼
       [RiskScoreCalculator] ──► Công thức tính tổng điểm
                   │
                   ▼
         [Xác định Risk Level]
         ┌─────────┼─────────┐
         ▼         ▼         ▼
     [Low Risk] [Med Risk] [High Risk]
         │         │         │ (Khóa tự động duyệt)
         │         │         ▼
         │         │   [Kế toán Review]
         │         │         │ (Nếu đồng ý duyệt)
         │         │         ▼
         │         │   [Manual Override]
         │         │         │
         ▼         ▼         ▼
  [Lưu DB: Lưu vết Anomaly & Ghi nhận lịch sử duyệt ghi đè]
```

---

## 2. Chi Tiết Các Bộ Phân Tích Bất Thường (Analyzers)

### 2.1. Math Consistency Checker (Nhất Quán Toán Học)
* **File thực thi**: [mathConsistency.checker.ts](file:///d:/WorkSpace/TLCN/ERP-MINI/erp-backend/src/modules/document-intelligence/services/anomaly/mathConsistency.checker.ts)
* **Nguyên lý**: So khớp số liệu logic giữa các trường thông tin trên hóa đơn để phát hiện lỗi tính toán của nhà cung cấp hoặc lỗi nhận diện ký tự của OCR. Sai số chênh lệch cho phép làm tròn là `< 0.01`.
* **Quy tắc & Cờ lỗi**:
  * **`line_amount_mismatch` (Mức độ: `medium`)**:
    ```text
    Thành tiền dòng = Số lượng * Đơn giá - Chiết khấu dòng
    ```
  * **`subtotal_mismatch` (Mức độ: `high`)**:
    ```text
    Tổng phụ (Subtotal) = Tổng thành tiền của tất cả các dòng
    ```
  * **`total_mismatch` (Mức độ: `high`)**:
    ```text
    Tổng thanh toán (Total) = Subtotal - Chiết khấu tổng đơn + Tổng tiền thuế
    ```

### 2.2. Statistical Analyzer (Phân Tích Thống Kê Giá)
* **File thực thi**: [statistical.analyzer.ts](file:///d:/WorkSpace/TLCN/ERP-MINI/erp-backend/src/modules/document-intelligence/services/anomaly/statistical.analyzer.ts)
* **Nguyên lý**: So sánh đơn giá và số lượng mua của sản phẩm trên hóa đơn hiện tại với lịch sử mua hàng trong quá khứ để phát hiện biến động giá bất thường.
* **Thuật toán áp dụng**:
  * **Phân phối chuẩn (Z-Score)**: Tính giá trị trung bình (Mean) và độ lệch chuẩn (StdDev) của giá sản phẩm trong lịch sử.
    ```text
    Z = (Đơn giá hóa đơn - Giá trung bình) / Độ lệch chuẩn
    ```
    Nếu trị tuyệt đối của Z > 3.0 (ngưỡng tùy chỉnh), đơn giá của dòng đó bị coi là bất thường (cờ `price_outlier`).
  * **Khoảng tứ phân vị (IQR)**: Sử dụng khi số lượng mẫu lịch sử nhỏ. Xác định khoảng biến động chấp nhận được:
    ```text
    Khoảng chấp nhận = [Q1 - 1.5 * IQR, Q3 + 1.5 * IQR]
    (Trong đó IQR = Q3 - Q1)
    ```
    Đơn giá nằm ngoài khoảng này sẽ kích hoạt cờ cảnh báo.

### 2.3. Fraud Pattern Detector (Phát Hiện Mẫu Gian Lận)
* **File thực thi**: [fraudPattern.detector.ts](file:///d:/WorkSpace/TLCN/ERP-MINI/erp-backend/src/modules/document-intelligence/services/anomaly/fraudPattern.detector.ts)
* **Nguyên lý**: Quét cấu trúc dữ liệu và chuỗi văn bản để phát hiện các dấu hiệu hóa đơn rác hoặc hành vi né tránh quy trình phê duyệt:
  * **Từ khóa nghi ngờ (Suspicious Text)**: Sử dụng Regex để quét tìm các chữ như *"Draft"*, *"Sample"*, *"Test"*, *"Void"*, *"Hóa đơn mẫu"*, *"Bản nháp"*. Gắn cờ `suspicious_text` (Mức độ: `high`).
  * **Mã số thuế không hợp lệ**: Kiểm tra MST nhà cung cấp có khớp định dạng 10 số hoặc 13 số. Gắn cờ `invalid_tax_code` (Mức độ: `medium`).
  * **Trùng lặp số tiền lặp lại (Repetitive Amounts)**: Phát hiện hành vi chia nhỏ hóa đơn bằng cách quét các hóa đơn của cùng nhà cung cấp có cùng số tiền chính xác phát sinh liên tục gần nhau. Gắn cờ `repetitive_amounts` (Mức độ: `high`).
  * **Làm tròn tiền đáng ngờ (Rounding Anomaly)**: Cảnh báo nếu số tiền hóa đơn lớn nhưng luôn được làm tròn đến hàng triệu mà không có số lẻ đồng nào.

### 2.4. Behavioral Anomaly Detector (Phân Tích Hành Vi Gửi)
* **File thực thi**: [behavioral.detector.ts](file:///d:/WorkSpace/TLCN/ERP-MINI/erp-backend/src/modules/document-intelligence/services/anomaly/behavioral.detector.ts)
* **Nguyên lý**: Theo dõi bất thường về mặt thời gian và tần suất tương tác của người dùng gửi hóa đơn:
  * **Ngoài giờ làm việc (Off-hours Upload)**: Phát hiện hóa đơn tải lên vào nửa đêm (từ 00:00 đến 04:00 sáng) hoặc các ngày lễ tết quốc gia. Gắn cờ `off_hours_upload` (Mức độ: `low`).
  * **Tần suất tăng vọt (Spike in Frequency)**: Cảnh báo nếu một user hoặc một chi nhánh tải lên đột biến nhiều hóa đơn trong 1 giờ vượt ngưỡng cho phép (phòng ngừa spam tệp tin rác).

### 2.5. Isolation Forest Analyzer (Mô Hình Học Máy Rừng Cô Lập)
* **File thực thi**: [isolationForest.analyzer.ts](file:///d:/WorkSpace/TLCN/ERP-MINI/erp-backend/src/modules/document-intelligence/services/anomaly/isolationForest.analyzer.ts)
* **Nguyên lý**: Sử dụng thuật toán học máy không giám sát **Isolation Forest** để phát hiện bất thường đa biến (Multivariate Anomaly).
* **Ứng dụng**: Nhận diện những trường hợp mà từng giá trị đơn lẻ trông rất bình thường (đơn giá bình thường, số lượng bình thường) nhưng sự kết hợp đồng thời giữa các biến (Nhà cung cấp A + Sản phẩm B + Giá C + Chi nhánh D) lại là một mẫu dữ liệu cực kỳ dị biệt so với toàn bộ dữ liệu lịch sử. Trả về cờ `multivariate_anomaly` (Mức độ: `high`).

---

## 3. Tính Toán Điểm Rủi Ro (Risk Score)

Khi kết thúc tiến trình chạy các bộ phân tích, danh sách các cờ phát hiện được chuyển qua [riskScore.calculator.ts](file:///d:/WorkSpace/TLCN/ERP-MINI/erp-backend/src/modules/document-intelligence/services/anomaly/riskScore.calculator.ts) để tính toán điểm rủi ro tổng hợp.

### 3.1. Trọng số mức độ nghiêm trọng (Severity Weights)
Mỗi cờ lỗi được quy định mức độ đóng góp điểm rủi ro như sau:
* **`critical` (Khẩn cấp)**: Đóng góp **`0.4`** điểm.
* **`high` (Cao)**: Đóng góp **`0.25`** điểm.
* **`medium` (Trung bình)**: Đóng góp **`0.1`** điểm.
* **`low` (Thấp)**: Đóng góp **`0.05`** điểm.

### 3.2. Công thức tính toán
Điểm số rủi ro tổng hợp được cộng dồn từ tất cả các cờ lỗi phát hiện được và giới hạn giá trị cực đại là 1.0:

```text
Risk Score = Min(Tổng trọng số của tất cả các cờ lỗi phát hiện được, 1.0)
```

---

## 4. Phân Loại Mức Độ Rủi Ro & Phê Duyệt Ghi Đè (Manual Override)

Hệ thống sử dụng điểm `Risk Score` để phân loại và xử lý luồng duyệt hóa đơn:

```text
┌───────────────────────────────┬───────────────────────────────┐
│ Risk Score >= High Threshold   │ Risk Score >= Med Threshold   │
│ (Mặc định >= 0.70)            │ (Mặc định >= 0.40)            │
├───────────────────────────────┼───────────────────────────────┤
│            HIGH RISK          │          MEDIUM RISK          │
│  - Khóa tính năng tự duyệt   │  - Cảnh báo vàng trên UI      │
│  - Yêu cầu Kế toán review    │  - Cho phép chạy 3-Way Match  │
│  - Ghi đè bắt buộc kèm lý do  │  - Cần kế toán lưu ý          │
└───────────────────────────────┴───────────────────────────────┘
```
*(Nếu Risk Score < 0.4, hóa đơn được phân loại là `low_risk` - Hợp lệ và chạy thẳng vào luồng so khớp tự động)*.

### Cơ chế ghi vết kiểm toán (Audit Trail) khi Ghi Đè
Trong trường hợp kế toán xác nhận hóa đơn `high_risk` là hợp lệ do trường hợp ngoại lệ thực tế và muốn phê duyệt thủ công:
1. Hệ thống yêu cầu người dùng nhập **Lý do duyệt ghi đè** trên giao diện review hóa đơn.
2. Hàm `recordOverride()` trong [anomaly.repository.ts](file:///d:/WorkSpace/TLCN/ERP-MINI/erp-backend/src/modules/document-intelligence/services/anomaly/anomaly.repository.ts) sẽ ghi đè trạng thái và lưu vĩnh viễn một bản ghi kiểm toán vào cơ sở dữ liệu bao gồm:
   * **`user_id`**: ID của kế toán thực hiện duyệt.
   * **`document_id`**: ID của hóa đơn OCR.
   * **`override_reason`**: Lý do ghi đè được nhập từ UI.
   * **`risk_score_at_override`**: Điểm số rủi ro gốc của hóa đơn lúc bị cảnh báo.
   * **`overridden_at`**: Thời gian ghi nhận hành động.
3. Dữ liệu lịch sử ghi đè này là bất biến, giúp doanh nghiệp dễ dàng truy xuất phục vụ kiểm toán tài chính nội bộ hoặc thuế.

---

## 5. Tham Chiếu Các File Source Code Liên Quan

* [anomalyDetector.service.ts](file:///d:/WorkSpace/TLCN/ERP-MINI/erp-backend/src/modules/document-intelligence/services/anomaly/anomalyDetector.service.ts): Bộ điều phối chạy song song các phân tích bất thường.
* [mathConsistency.checker.ts](file:///d:/WorkSpace/TLCN/ERP-MINI/erp-backend/src/modules/document-intelligence/services/anomaly/mathConsistency.checker.ts): Logic kiểm tra tính toán số học trên hóa đơn.
* [statistical.analyzer.ts](file:///d:/WorkSpace/TLCN/ERP-MINI/erp-backend/src/modules/document-intelligence/services/anomaly/statistical.analyzer.ts): Thuật toán thống kê Z-Score & IQR để kiểm soát biến động giá mua.
* [fraudPattern.detector.ts](file:///d:/WorkSpace/TLCN/ERP-MINI/erp-backend/src/modules/document-intelligence/services/anomaly/fraudPattern.detector.ts): Kiểm tra MST, chuỗi nhạy cảm, làm tròn số tiền và trùng lặp hóa đơn cận kề.
* [behavioral.detector.ts](file:///d:/WorkSpace/TLCN/ERP-MINI/erp-backend/src/modules/document-intelligence/services/anomaly/behavioral.detector.ts): Kiểm tra hành vi gửi ngoài giờ hành chính hoặc tần suất cao.
* [isolationForest.analyzer.ts](file:///d:/WorkSpace/TLCN/ERP-MINI/erp-backend/src/modules/document-intelligence/services/anomaly/isolationForest.analyzer.ts): Mô hình học máy phát hiện bất thường đa biến.
* [riskScore.calculator.ts](file:///d:/WorkSpace/TLCN/ERP-MINI/erp-backend/src/modules/document-intelligence/services/anomaly/riskScore.calculator.ts): Công thức tính điểm rủi ro tổng hợp.
* [anomaly.repository.ts](file:///d:/WorkSpace/TLCN/ERP-MINI/erp-backend/src/modules/document-intelligence/services/anomaly/anomaly.repository.ts): Nơi lưu trữ thông tin bất thường và lịch sử ghi đè của kế toán vào DB.
