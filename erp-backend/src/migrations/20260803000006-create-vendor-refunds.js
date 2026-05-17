"use strict";
// Phase 3 — Tạo bảng vendor_refunds (NCC hoàn tiền)
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("vendor_refunds", {
      id:              { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      branch_id:       { type: Sequelize.BIGINT, allowNull: false, references: { model: "branches", key: "id" }, onDelete: "RESTRICT" },
      refund_no:       { type: Sequelize.STRING(50), allowNull: false, unique: true },
      debit_note_id:   { type: Sequelize.BIGINT, allowNull: true,  references: { model: "ap_debit_notes", key: "id" }, onDelete: "SET NULL" },
      supplier_id:     { type: Sequelize.BIGINT, allowNull: false, references: { model: "partners", key: "id" }, onDelete: "RESTRICT" },
      refund_date:     { type: Sequelize.DATEONLY, allowNull: false },
      amount:          { type: Sequelize.DECIMAL(18, 2), allowNull: false },
      method:          { type: Sequelize.ENUM("cash","bank","transfer"), allowNull: false, defaultValue: "bank" },
      bank_account_id: { type: Sequelize.BIGINT, allowNull: true,  references: { model: "bank_accounts", key: "id" }, onDelete: "SET NULL" },
      transaction_reference: { type: Sequelize.STRING(100), allowNull: true },
      currency_id:     { type: Sequelize.BIGINT, allowNull: true,  references: { model: "currencies", key: "id" }, onDelete: "SET NULL" },
      exchange_rate:   { type: Sequelize.DECIMAL(18, 6), allowNull: false, defaultValue: 1.0 },
      status:          { type: Sequelize.ENUM("draft","posted"), allowNull: false, defaultValue: "draft" },
      approval_status: { type: Sequelize.ENUM("draft","waiting_approval","approved","rejected"), allowNull: false, defaultValue: "draft" },
      gl_entry_id:     { type: Sequelize.BIGINT, allowNull: true,  references: { model: "gl_entries", key: "id" }, onDelete: "SET NULL" },
      created_by:      { type: Sequelize.BIGINT, allowNull: false, references: { model: "users", key: "id" }, onDelete: "RESTRICT" },
      approved_by:     { type: Sequelize.BIGINT, allowNull: true,  references: { model: "users", key: "id" }, onDelete: "SET NULL" },
      submitted_at:    { type: Sequelize.DATE, allowNull: true },
      approved_at:     { type: Sequelize.DATE, allowNull: true },
      notes:           { type: Sequelize.TEXT, allowNull: true },
      created_at:      { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updated_at:      { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP") },
    });
    await queryInterface.addIndex("vendor_refunds", ["branch_id", "status"], { name: "idx_vr_branch_status" });
    await queryInterface.addIndex("vendor_refunds", ["supplier_id"],          { name: "idx_vr_supplier_id" });
    await queryInterface.addIndex("vendor_refunds", ["debit_note_id"],        { name: "idx_vr_debit_note_id" });
    await queryInterface.addIndex("vendor_refunds", ["refund_date"],          { name: "idx_vr_refund_date" });
  },
  async down(queryInterface) {
    await queryInterface.dropTable("vendor_refunds");
  },
};
