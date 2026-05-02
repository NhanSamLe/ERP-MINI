"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    const cols = {
      pipeline_id: { type: Sequelize.BIGINT, references: { model: "crm_pipelines", key: "id" }, allowNull: true },
      pipeline_stage_id: { type: Sequelize.BIGINT, references: { model: "crm_pipeline_stages", key: "id" }, allowNull: true },
      branch_id: { type: Sequelize.BIGINT, references: { model: "branches", key: "id" }, allowNull: true },
      next_action: { type: Sequelize.STRING(255), allowNull: true },
      next_action_date: { type: Sequelize.DATE, allowNull: true },
      lost_reason: { type: Sequelize.TEXT, allowNull: true },
      actual_close_date: { type: Sequelize.DATE, allowNull: true },
    };
    for (const [col, def] of Object.entries(cols)) {
      await queryInterface.addColumn("crm_opportunities", col, def);
    }
  },
  async down(queryInterface) {
    const cols = ["pipeline_id","pipeline_stage_id","branch_id","next_action","next_action_date","lost_reason","actual_close_date"];
    for (const col of cols) await queryInterface.removeColumn("crm_opportunities", col);
  },
};
