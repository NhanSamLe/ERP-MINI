"use strict";
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert("crm_lead_sources", [
      { name: "Website", description: "Khách hàng từ website", is_active: 1, created_at: now, updated_at: now },
      { name: "Facebook", description: "Quảng cáo Facebook", is_active: 1, created_at: now, updated_at: now },
      { name: "Google Ads", description: "Quảng cáo Google", is_active: 1, created_at: now, updated_at: now },
      { name: "Giới thiệu", description: "Khách hàng giới thiệu", is_active: 1, created_at: now, updated_at: now },
      { name: "Cold Call", description: "Gọi điện trực tiếp", is_active: 1, created_at: now, updated_at: now },
      { name: "Hội chợ", description: "Triển lãm / Hội chợ", is_active: 1, created_at: now, updated_at: now },
      { name: "Email Marketing", description: "Chiến dịch email", is_active: 1, created_at: now, updated_at: now },
      { name: "Khác", description: "Nguồn khác", is_active: 1, created_at: now, updated_at: now },
    ]);

    await queryInterface.bulkInsert("crm_pipelines", [
      { name: "Pipeline Bán Hàng", description: "Pipeline mặc định cho bán hàng B2B", is_default: 1, is_active: 1, created_at: now, updated_at: now },
    ]);
    // Get the pipeline ID
    const [pipelines] = await queryInterface.sequelize.query("SELECT id FROM crm_pipelines WHERE is_default = 1 LIMIT 1");
    const pipelineId = pipelines[0].id;

    await queryInterface.bulkInsert("crm_pipeline_stages", [
      { pipeline_id: pipelineId, name: "Leads mới", sequence: 1, probability: 10, is_won: 0, is_lost: 0, color: "#3498db", created_at: now, updated_at: now },
      { pipeline_id: pipelineId, name: "Đã liên hệ", sequence: 2, probability: 20, is_won: 0, is_lost: 0, color: "#2ecc71", created_at: now, updated_at: now },
      { pipeline_id: pipelineId, name: "Đã demo/giới thiệu", sequence: 3, probability: 40, is_won: 0, is_lost: 0, color: "#f39c12", created_at: now, updated_at: now },
      { pipeline_id: pipelineId, name: "Đang đàm phán", sequence: 4, probability: 60, is_won: 0, is_lost: 0, color: "#e67e22", created_at: now, updated_at: now },
      { pipeline_id: pipelineId, name: "Gửi báo giá", sequence: 5, probability: 75, is_won: 0, is_lost: 0, color: "#9b59b6", created_at: now, updated_at: now },
      { pipeline_id: pipelineId, name: "Thắng", sequence: 6, probability: 100, is_won: 1, is_lost: 0, color: "#27ae60", created_at: now, updated_at: now },
      { pipeline_id: pipelineId, name: "Thua", sequence: 7, probability: 0, is_won: 0, is_lost: 1, color: "#e74c3c", created_at: now, updated_at: now },
    ]);
  },
  async down(queryInterface) {
    await queryInterface.bulkDelete("crm_pipeline_stages", null, {});
    await queryInterface.bulkDelete("crm_pipelines", null, {});
    await queryInterface.bulkDelete("crm_lead_sources", null, {});
  },
};
