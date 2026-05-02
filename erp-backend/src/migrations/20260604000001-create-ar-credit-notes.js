"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("ar_credit_notes", {
      id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      branch_id: { type: Sequelize.BIGINT, allowNull: false, references: { model: "branches", key: "id" } },
      credit_note_no: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      sales_return_id: { type: Sequelize.BIGINT, references: { model: "sales_returns", key: "id" } },
      original_invoice_id: { type: Sequelize.BIGINT, references: { model: "ar_invoices", key: "id" } },
      customer_id: { type: Sequelize.BIGINT, allowNull: false, references: { model: "partners", key: "id" } },
      credit_note_date: { type: Sequelize.DATEONLY, allowNull: false },
      status: { type: Sequelize.ENUM("draft","posted","applied","cancelled"), defaultValue: "draft" },
      approval_status: { type: Sequelize.ENUM("draft","waiting_approval","approved","rejected"), defaultValue: "draft" },
      total_before_tax: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      total_tax: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      total_after_tax: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      currency_id: { type: Sequelize.BIGINT, references: { model: "currencies", key: "id" } },
      exchange_rate: { type: Sequelize.DECIMAL(18, 6), defaultValue: 1.000000 },
      created_by: { type: Sequelize.BIGINT, references: { model: "users", key: "id" } },
      approved_by: { type: Sequelize.BIGINT, references: { model: "users", key: "id" } },
      notes: { type: Sequelize.TEXT },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP") },
    });
  },
  async down(qi) { await qi.dropTable("ar_credit_notes"); },
};
