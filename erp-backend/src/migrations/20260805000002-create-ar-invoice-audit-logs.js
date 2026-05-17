"use strict";
// Phase 5 — Tạo ar_invoice_audit_logs
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("ar_invoice_audit_logs", {
      id:             { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      ar_invoice_id:  { type: Sequelize.BIGINT, allowNull: false, references: { model: "ar_invoices", key: "id" }, onDelete: "CASCADE" },
      action:         { type: Sequelize.STRING(50), allowNull: false },
      old_values:     { type: Sequelize.JSON, allowNull: true },
      new_values:     { type: Sequelize.JSON, allowNull: true },
      changed_by:     { type: Sequelize.BIGINT, allowNull: false, references: { model: "users", key: "id" }, onDelete: "RESTRICT" },
      changed_at:     { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      created_at:     { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
    });
    await queryInterface.addIndex("ar_invoice_audit_logs", ["ar_invoice_id"], { name: "idx_ar_inv_audit_invoice_id" });
    await queryInterface.addIndex("ar_invoice_audit_logs", ["changed_by"],    { name: "idx_ar_inv_audit_changed_by" });
    await queryInterface.addIndex("ar_invoice_audit_logs", ["changed_at"],    { name: "idx_ar_inv_audit_changed_at" });
  },
  async down(queryInterface) { await queryInterface.dropTable("ar_invoice_audit_logs"); },
};
