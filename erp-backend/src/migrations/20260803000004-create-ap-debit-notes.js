"use strict";
// Phase 3 — Tạo bảng ap_debit_notes
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("ap_debit_notes", {
      id:                      { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      branch_id:               { type: Sequelize.BIGINT, allowNull: false, references: { model: "branches", key: "id" }, onDelete: "RESTRICT" },
      debit_note_no:           { type: Sequelize.STRING(50), allowNull: false, unique: true },
      purchase_return_id:      { type: Sequelize.BIGINT, allowNull: true,  references: { model: "purchase_returns", key: "id" }, onDelete: "SET NULL" },
      original_ap_invoice_id:  { type: Sequelize.BIGINT, allowNull: true,  references: { model: "ap_invoices", key: "id" }, onDelete: "SET NULL" },
      supplier_id:             { type: Sequelize.BIGINT, allowNull: false, references: { model: "partners", key: "id" }, onDelete: "RESTRICT" },
      debit_note_date:         { type: Sequelize.DATEONLY, allowNull: false },
      status:                  { type: Sequelize.ENUM("draft","posted","applied","cancelled"), allowNull: false, defaultValue: "draft" },
      approval_status:         { type: Sequelize.ENUM("draft","waiting_approval","approved","rejected"), allowNull: false, defaultValue: "draft" },
      total_before_tax:        { type: Sequelize.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
      total_tax:               { type: Sequelize.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
      total_after_tax:         { type: Sequelize.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
      currency_id:             { type: Sequelize.BIGINT, allowNull: true,  references: { model: "currencies", key: "id" }, onDelete: "SET NULL" },
      exchange_rate:           { type: Sequelize.DECIMAL(18, 6), allowNull: false, defaultValue: 1.0 },
      gl_entry_id:             { type: Sequelize.BIGINT, allowNull: true,  references: { model: "gl_entries", key: "id" }, onDelete: "SET NULL" },
      created_by:              { type: Sequelize.BIGINT, allowNull: false, references: { model: "users", key: "id" }, onDelete: "RESTRICT" },
      approved_by:             { type: Sequelize.BIGINT, allowNull: true,  references: { model: "users", key: "id" }, onDelete: "SET NULL" },
      submitted_at:            { type: Sequelize.DATE, allowNull: true },
      approved_at:             { type: Sequelize.DATE, allowNull: true },
      reject_reason:           { type: Sequelize.TEXT, allowNull: true },
      notes:                   { type: Sequelize.TEXT, allowNull: true },
      created_at:              { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updated_at:              { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP") },
    });
    await queryInterface.addIndex("ap_debit_notes", ["branch_id", "status"],       { name: "idx_adn_branch_status" });
    await queryInterface.addIndex("ap_debit_notes", ["supplier_id"],               { name: "idx_adn_supplier_id" });
    await queryInterface.addIndex("ap_debit_notes", ["original_ap_invoice_id"],    { name: "idx_adn_ap_invoice_id" });
    await queryInterface.addIndex("ap_debit_notes", ["debit_note_date"],           { name: "idx_adn_date" });
  },
  async down(queryInterface) {
    await queryInterface.dropTable("ap_debit_notes");
  },
};
