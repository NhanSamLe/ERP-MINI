"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("crm_pipeline_stages", {
      id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      pipeline_id: { type: Sequelize.BIGINT, allowNull: false, references: { model: "crm_pipelines", key: "id" }, onDelete: "CASCADE" },
      name: { type: Sequelize.STRING(100), allowNull: false },
      sequence: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      probability: { type: Sequelize.DECIMAL(5, 2), defaultValue: 0 },
      is_won: { type: Sequelize.TINYINT(1), defaultValue: 0 },
      is_lost: { type: Sequelize.TINYINT(1), defaultValue: 0 },
      color: { type: Sequelize.STRING(20) },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP") },
    });
  },
  async down(qi) { await qi.dropTable("crm_pipeline_stages"); },
};
