"use strict";
// Phase 3 — Tạo bảng purchase_returns
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("purchase_returns", {
      id:                  { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      branch_id:           { type: Sequelize.BIGINT, allowNull: false, references: { model: "branches", key: "id" }, onDelete: "RESTRICT" },
      return_no:           { type: Sequelize.STRING(50), allowNull: false, unique: true },
      pra_id:              { type: Sequelize.BIGINT, allowNull: true,  references: { model: "purchase_return_authorizations", key: "id" }, onDelete: "SET NULL" },
      purchase_order_id:   { type: Sequelize.BIGINT, allowNull: true,  references: { model: "purchase_orders", key: "id" }, onDelete: "SET NULL" },
      supplier_id:         { type: Sequelize.BIGINT, allowNull: false, references: { model: "partners", key: "id" }, onDelete: "RESTRICT" },
      return_date:         { type: Sequelize.DATEONLY, allowNull: false },
      warehouse_id:        { type: Sequelize.BIGINT, allowNull: true,  references: { model: "warehouses", key: "id" }, onDelete: "SET NULL" },
      status: {
        type: Sequelize.ENUM("draft","shipped","confirmed","completed","cancelled"),
        allowNull: false, defaultValue: "draft",
      },
      approval_status:     { type: Sequelize.ENUM("draft","waiting_approval","approved","rejected"), allowNull: false, defaultValue: "draft" },
      total_return_amount: { type: Sequelize.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
      stock_move_id:       { type: Sequelize.BIGINT, allowNull: true, references: { model: "stock_moves", key: "id" }, onDelete: "SET NULL", comment: "Stock move xuất kho trả NCC" },
      created_by:          { type: Sequelize.BIGINT, allowNull: false, references: { model: "users", key: "id" }, onDelete: "RESTRICT" },
      approved_by:         { type: Sequelize.BIGINT, allowNull: true,  references: { model: "users", key: "id" }, onDelete: "SET NULL" },
      submitted_at:        { type: Sequelize.DATE, allowNull: true },
      approved_at:         { type: Sequelize.DATE, allowNull: true },
      notes:               { type: Sequelize.TEXT, allowNull: true },
      created_at:          { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updated_at:          { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP") },
    });
    await queryInterface.addIndex("purchase_returns", ["branch_id", "status"], { name: "idx_pr_branch_status" });
    await queryInterface.addIndex("purchase_returns", ["supplier_id"],          { name: "idx_pr_supplier_id" });
    await queryInterface.addIndex("purchase_returns", ["pra_id"],               { name: "idx_pr_pra_id" });
    await queryInterface.addIndex("purchase_returns", ["return_date"],          { name: "idx_pr_return_date" });
  },
  async down(queryInterface) {
    await queryInterface.dropTable("purchase_returns");
  },
};
