"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const narrativeConfigs = [
      {
        company_id: 1,
        narrative_type: "monthly_report",
        template_name: "Monthly Financial Report",
        prompt_template: `Bạn là một chuyên gia phân tích tài chính có 15 năm kinh nghiệm. 
Dựa trên dữ liệu KPI sau, hãy viết một đoạn nhận xét tự nhiên (2-3 câu) về tình hình tài chính của công ty trong tháng.

Dữ liệu KPI:
{kpi_data}

Yêu cầu:
- Viết bằng tiếng Việt
- Tone chuyên nghiệp, phân tích
- Highlight những điểm nổi bật (tăng/giảm > 20%)
- Đưa ra nhận xét về xu hướng
- Không vượt quá 500 từ

Hãy viết ngay:`,
        tone: "analytical",
        language: "vi",
        max_tokens: 500,
        temperature: 0.7,
        is_active: true,
      },
      {
        company_id: 1,
        narrative_type: "sales_performance",
        template_name: "Sales Performance Analysis",
        prompt_template: `Bạn là một chuyên gia bán hàng có 15 năm kinh nghiệm.
Dựa trên dữ liệu bán hàng sau, hãy viết một đoạn nhận xét tự nhiên (2-3 câu) về hiệu suất bán hàng.

Dữ liệu:
{kpi_data}

Yêu cầu:
- Viết bằng tiếng Việt
- Tone chuyên nghiệp, phân tích
- Phân tích top products
- Nhận xét về xu hướng bán hàng
- Không vượt quá 500 từ

Hãy viết ngay:`,
        tone: "analytical",
        language: "vi",
        max_tokens: 500,
        temperature: 0.7,
        is_active: true,
      },
      {
        company_id: 1,
        narrative_type: "vendor_performance",
        template_name: "Vendor Performance Review",
        prompt_template: `Bạn là một chuyên gia quản lý chuỗi cung ứng có 15 năm kinh nghiệm.
Dựa trên dữ liệu nhà cung cấp sau, hãy viết một đoạn nhận xét tự nhiên (2-3 câu) về hiệu suất nhà cung cấp.

Dữ liệu:
{kpi_data}

Yêu cầu:
- Viết bằng tiếng Việt
- Tone chuyên nghiệp, phân tích
- Đánh giá on-time delivery
- Nhận xét về chất lượng
- Không vượt quá 500 từ

Hãy viết ngay:`,
        tone: "analytical",
        language: "vi",
        max_tokens: 500,
        temperature: 0.7,
        is_active: true,
      },
      {
        company_id: 1,
        narrative_type: "cash_flow",
        template_name: "Cash Flow Commentary",
        prompt_template: `Bạn là một chuyên gia tài chính có 15 năm kinh nghiệm.
Dựa trên dữ liệu dòng tiền sau, hãy viết một đoạn nhận xét tự nhiên (2-3 câu) về tình hình dòng tiền.

Dữ liệu:
{kpi_data}

Yêu cầu:
- Viết bằng tiếng Việt
- Tone chuyên nghiệp, phân tích
- Phân tích AR/AP aging
- Nhận xét về DSO/DPO
- Không vượt quá 500 từ

Hãy viết ngay:`,
        tone: "analytical",
        language: "vi",
        max_tokens: 500,
        temperature: 0.7,
        is_active: true,
      },
    ];

    await queryInterface.bulkInsert("ai_narrative_configs", narrativeConfigs);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("ai_narrative_configs", null, {});
  },
};
