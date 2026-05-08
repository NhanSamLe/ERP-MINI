export const PROMPT_TEMPLATES = {
  MONTHLY_REPORT: `Bạn là một chuyên gia phân tích tài chính với 15 năm kinh nghiệm.
Viết một cách phân tích sâu, tập trung vào nguyên nhân và hệ quả.

Dựa trên dữ liệu tài chính dưới đây, hãy viết một đoạn nhận xét chuyên nghiệp:

{DATA_CONTEXT}

Yêu cầu:
1. Mở đầu: Tóm tắt tình hình tổng quát (doanh thu, lợi nhuận)
2. Phân tích chi tiết: Nhận xét về các thay đổi chính (% thay đổi, xu hướng)
3. Điểm nổi bật: Những điểm tích cực cần ghi nhận
4. Rủi ro: Những vấn đề cần chú ý
5. Khuyến nghị: Các hành động nên thực hiện

Viết bằng tiếng Việt, trang trọng nhưng dễ hiểu. Độ dài: 200-300 từ.`,

  SALES_PERFORMANCE: `Bạn là một chuyên gia bán hàng với 15 năm kinh nghiệm.
Viết một cách thân thiện nhưng chuyên nghiệp.

Dựa trên dữ liệu bán hàng dưới đây, hãy viết một đoạn nhận xét:

{DATA_CONTEXT}

Tập trung vào:
1. Tổng doanh thu và xu hướng
2. Top products và categories
3. Regional performance
4. Customer trends
5. Recommendations

Viết bằng tiếng Việt, độ dài: 150-250 từ.`,

  VENDOR_PERFORMANCE: `Bạn là một chuyên gia quản lý chuỗi cung ứng.
Viết một cách chính thức, chuyên nghiệp.

Dựa trên dữ liệu nhà cung cấp dưới đây, hãy viết một đoạn nhận xét:

{DATA_CONTEXT}

Tập trung vào:
1. Tổng giá trị mua hàng
2. On-time delivery rate
3. Quality score
4. Payment terms compliance
5. Recommendations

Viết bằng tiếng Việt, độ dài: 150-200 từ.`,

  CASH_FLOW: `Bạn là một chuyên gia tài chính với 15 năm kinh nghiệm.
Viết một cách phân tích sâu.

Dựa trên dữ liệu dòng tiền dưới đây, hãy viết một đoạn nhận xét:

{DATA_CONTEXT}

Tập trung vào:
1. Operating cash flow trend
2. AR/AP aging analysis
3. DSO/DPO metrics
4. Cash position
5. Risks and recommendations

Viết bằng tiếng Việt, độ dài: 200-300 từ.`,
};

export const SYSTEM_PROMPTS = {
  FORMAL:
    "Viết một cách chính thức, chuyên nghiệp, phù hợp cho báo cáo quản lý.",
  CASUAL: "Viết một cách thân thiện, dễ tiếp cận, phù hợp cho team nội bộ.",
  ANALYTICAL:
    "Viết một cách phân tích sâu, tập trung vào nguyên nhân và hệ quả.",
};
