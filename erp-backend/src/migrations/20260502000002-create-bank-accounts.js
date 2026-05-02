"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("bank_accounts", {
      id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      company_id: {
        type: Sequelize.BIGINT,
        references: { model: "companies", key: "id" },
        allowNull: true,
      },
      branch_id: {
        type: Sequelize.BIGINT,
        references: { model: "branches", key: "id" },
        allowNull: true,
      },
      account_name: { type: Sequelize.STRING(200), allowNull: false },
      account_number: { type: Sequelize.STRING(50), allowNull: false },
      bank_name: { type: Sequelize.STRING(200), allowNull: false },
      bank_branch: { type: Sequelize.STRING(200), allowNull: true },
      currency_id: {
        type: Sequelize.BIGINT,
        references: { model: "currencies", key: "id" },
        allowNull: true,
      },
      gl_account_id: {
        type: Sequelize.BIGINT,
        references: { model: "gl_accounts", key: "id" },
        allowNull: true,
      },
      is_default: { type: Sequelize.TINYINT(1), defaultValue: 0 },
      is_active: { type: Sequelize.TINYINT(1), defaultValue: 1 },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("bank_accounts");
  },
};
