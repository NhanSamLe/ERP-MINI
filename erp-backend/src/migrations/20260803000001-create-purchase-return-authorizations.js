"use strict";
// Phase 3 — Tạo bảng purchase_return_authorizations (PRA)
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("purchase_return_authorizations", {
      id:                   { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      branch_id:            { type: Sequelize.BIGINT, allowNull: false, references: { model: "branches", key: "id" }, onDelete: "RESTRICT" },
      pra_no:               { type: Sequelize.STRING(50), allowNull: false, unique: true },
      purchase_order_id:    { type: Sequelize.BIGINT, allowNull: false, references: { model: "purchase_orders", key: "id" }, onDelete: "RESTRICT" },
      ap_invoice_id:        { type: Sequelize.BIGINT, allowNull: true,  references: { model: "ap_invoices", key: "id" }, onDelete: "SET NULL" },
      supplier_id:          { type: Sequelize.BIGINT, allowNull: false, references: { model: "partners", key: "id" }, onDelete: "RESTRICT" },
      reason:               { type: Sequelize.TEXT, allowNull: false },
      return_type:          { type: Sequelize.ENUM("refund","replacement","debit_note"), allowNull: false, defaultValue: "debit_note" },
      status: {
        type: Sequelize.ENUM("draft","submitted","approved","rejected","processing","completed","cancelled"),
        allowNull: false, defaultValue: "draft",
      },
      approval_status:      { type: Sequelize.ENUM("draft","waiting_approval","approved","rejected"), allowNull: false, defaultValue: "draft" },
      total_return_amount:  { type: Sequelize.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
      created_by:           { type: Sequelize.BIGINT, allowNull: false, references: { model: "users", key: "id" }, onDelete: "RESTRICT" },
      approved_by:          { type: Sequelize.BIGINT, allowNull: true,  references: { model: "users", key: "id" }, onDelete: "SET NULL" },
      submitted_at:         { type: Sequelize.DATE, allowNull: true },
      approved_at:          { type: Sequelize.DATE, allowNull: true },
      reject_reason:        { type: Sequelize.TEXT, allowNull: true },
      notes:                { type: Sequelize.TEXT, allowNull: true },
      created_at:           { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updated_at:           { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP") },
    });
    await queryInterface.addIndex("purchase_return_authorizations", ["branch_id", "status"],   { name: "idx_pra_branch_status" });
    await queryInterface.addIndex("purchase_return_authorizations", ["supplier_id"],            { name: "idx_pra_supplier_id" });
    await queryInterface.addIndex("purchase_return_authorizations", ["purchase_order_id"],      { name: "idx_pra_po_id" });
  },
  async down(queryInterface) {
    await queryInterface.dropTable("purchase_return_authorizations");
  },
};
