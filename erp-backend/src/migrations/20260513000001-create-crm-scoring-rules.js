"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("crm_scoring_rules", {
      id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      name: { type: Sequelize.STRING(100), allowNull: false },
      field: { type: Sequelize.STRING(50), allowNull: false },
      operator: { type: Sequelize.ENUM("equals","not_equals","contains","greater_than","less_than","is_true","is_false"), allowNull: false },
      value: { type: Sequelize.STRING(255) },
      score: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      is_active: { type: Sequelize.TINYINT(1), defaultValue: 1 },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP") },
    });
  },
  async down(qi) { await qi.dropTable("crm_scoring_rules"); },
};
