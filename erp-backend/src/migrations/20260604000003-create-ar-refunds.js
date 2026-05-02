"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("ar_refunds", {
      id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      branch_id: { type: Sequelize.BIGINT, allowNull: false, references: { model: "branches", key: "id" } },
      refund_no: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      credit_note_id: { type: Sequelize.BIGINT, references: { model: "ar_credit_notes", key: "id" } },
      customer_id: { type: Sequelize.BIGINT, allowNull: false, references: { model: "partners", key: "id" } },
      refund_date: { type: Sequelize.DATEONLY, allowNull: false },
      amount: { type: Sequelize.DECIMAL(18, 2), allowNull: false },
      method: { type: Sequelize.ENUM("cash","bank","transfer"), defaultValue: "bank" },
      bank_account_id: { type: Sequelize.BIGINT, references: { model: "bank_accounts", key: "id" } },
      status: { type: Sequelize.ENUM("draft","posted"), defaultValue: "draft" },
      approval_status: { type: Sequelize.ENUM("draft","waiting_approval","approved","rejected"), defaultValue: "draft" },
      gl_entry_id: { type: Sequelize.BIGINT, references: { model: "gl_entries", key: "id" } },
      created_by: { type: Sequelize.BIGINT, references: { model: "users", key: "id" } },
      approved_by: { type: Sequelize.BIGINT, references: { model: "users", key: "id" } },
      notes: { type: Sequelize.TEXT },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP") },
    });
  },
  async down(qi) { await qi.dropTable("ar_refunds"); },
};
