"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    const cols = {
      branch_id: { type: Sequelize.BIGINT, references: { model: "branches", key: "id" }, allowNull: true },
      source_id: { type: Sequelize.BIGINT, references: { model: "crm_lead_sources", key: "id" }, allowNull: true },
      company_name: { type: Sequelize.STRING(200), allowNull: true },
      job_title: { type: Sequelize.STRING(100), allowNull: true },
      industry: { type: Sequelize.STRING(100), allowNull: true },
      company_size: { type: Sequelize.STRING(50), allowNull: true },
      annual_revenue: { type: Sequelize.DECIMAL(18, 2), allowNull: true },
      lead_score: { type: Sequelize.INTEGER, defaultValue: 0 },
      last_activity_date: { type: Sequelize.DATE, allowNull: true },
    };
    for (const [col, def] of Object.entries(cols)) {
      await queryInterface.addColumn("crm_leads", col, def);
    }
  },
  async down(queryInterface) {
    const cols = ["branch_id","source_id","company_name","job_title","industry","company_size","annual_revenue","lead_score","last_activity_date"];
    for (const col of cols) await queryInterface.removeColumn("crm_leads", col);
  },
};
