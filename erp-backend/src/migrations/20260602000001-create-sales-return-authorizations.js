"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("sales_return_authorizations", {
      id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      branch_id: { type: Sequelize.BIGINT, allowNull: false, references: { model: "branches", key: "id" } },
      rma_no: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      sale_order_id: { type: Sequelize.BIGINT, allowNull: false, references: { model: "sale_orders", key: "id" } },
      invoice_id: { type: Sequelize.BIGINT, references: { model: "ar_invoices", key: "id" } },
      customer_id: { type: Sequelize.BIGINT, allowNull: false, references: { model: "partners", key: "id" } },
      reason: { type: Sequelize.TEXT, allowNull: false },
      return_type: { type: Sequelize.ENUM("refund","replacement","credit_note"), defaultValue: "credit_note" },
      status: { type: Sequelize.ENUM("draft","submitted","approved","rejected","processing","completed","cancelled"), defaultValue: "draft" },
      approval_status: { type: Sequelize.ENUM("draft","waiting_approval","approved","rejected"), defaultValue: "draft" },
      total_return_amount: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      created_by: { type: Sequelize.BIGINT, references: { model: "users", key: "id" } },
      approved_by: { type: Sequelize.BIGINT, references: { model: "users", key: "id" } },
      submitted_at: { type: Sequelize.DATE },
      approved_at: { type: Sequelize.DATE },
      reject_reason: { type: Sequelize.TEXT },
      notes: { type: Sequelize.TEXT },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP") },
    });
  },
  async down(qi) { await qi.dropTable("sales_return_authorizations"); },
};
