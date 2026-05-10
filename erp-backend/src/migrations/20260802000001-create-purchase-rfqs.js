"use strict";
// Phase 2 — Tạo bảng purchase_rfqs
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("purchase_rfqs", {
      id:              { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      branch_id:       { type: Sequelize.BIGINT, allowNull: false, references: { model: "branches", key: "id" }, onDelete: "RESTRICT" },
      rfq_no:          { type: Sequelize.STRING(50), allowNull: false, unique: true },
      supplier_id:     { type: Sequelize.BIGINT, allowNull: true,  references: { model: "partners", key: "id" }, onDelete: "SET NULL" },
      currency_id:     { type: Sequelize.BIGINT, allowNull: true,  references: { model: "currencies", key: "id" }, onDelete: "SET NULL" },
      exchange_rate:   { type: Sequelize.DECIMAL(18, 6), allowNull: false, defaultValue: 1.0 },
      payment_term_id: { type: Sequelize.BIGINT, allowNull: true,  references: { model: "payment_terms", key: "id" }, onDelete: "SET NULL" },
      rfq_date:        { type: Sequelize.DATEONLY, allowNull: false },
      valid_until:     { type: Sequelize.DATEONLY, allowNull: true },
      status: {
        type: Sequelize.ENUM("draft","sent","received","accepted","rejected","expired","cancelled"),
        allowNull: false, defaultValue: "draft",
      },
      approval_status: {
        type: Sequelize.ENUM("draft","waiting_approval","approved","rejected"),
        allowNull: false, defaultValue: "draft",
      },
      version:          { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
      parent_id:        { type: Sequelize.BIGINT, allowNull: true, comment: "Self-ref cho versioning" },
      total_before_tax: { type: Sequelize.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
      total_tax:        { type: Sequelize.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
      total_after_tax:  { type: Sequelize.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
      discount_percent: { type: Sequelize.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
      discount_amount:  { type: Sequelize.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
      supplier_notes:   { type: Sequelize.TEXT, allowNull: true },
      internal_notes:   { type: Sequelize.TEXT, allowNull: true },
      buyer_id:         { type: Sequelize.BIGINT, allowNull: true, references: { model: "users", key: "id" }, onDelete: "SET NULL" },
      created_by:       { type: Sequelize.BIGINT, allowNull: false, references: { model: "users", key: "id" }, onDelete: "RESTRICT" },
      approved_by:      { type: Sequelize.BIGINT, allowNull: true,  references: { model: "users", key: "id" }, onDelete: "SET NULL" },
      submitted_at:     { type: Sequelize.DATE, allowNull: true },
      approved_at:      { type: Sequelize.DATE, allowNull: true },
      reject_reason:    { type: Sequelize.TEXT, allowNull: true },
      sent_at:          { type: Sequelize.DATE, allowNull: true },
      received_at:      { type: Sequelize.DATE, allowNull: true },
      created_at:       { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updated_at:       { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP") },
    });
    await queryInterface.addIndex("purchase_rfqs", ["branch_id", "status"],  { name: "idx_rfqs_branch_status" });
    await queryInterface.addIndex("purchase_rfqs", ["supplier_id"],           { name: "idx_rfqs_supplier_id" });
    await queryInterface.addIndex("purchase_rfqs", ["rfq_date"],              { name: "idx_rfqs_rfq_date" });
    await queryInterface.addIndex("purchase_rfqs", ["valid_until"],           { name: "idx_rfqs_valid_until" });
    await queryInterface.addIndex("purchase_rfqs", ["buyer_id"],              { name: "idx_rfqs_buyer_id" });
  },
  async down(queryInterface) {
    await queryInterface.dropTable("purchase_rfqs");
  },
};
