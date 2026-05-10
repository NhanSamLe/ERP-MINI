"use strict";
// Phase 3 — Tạo bảng purchase_return_lines
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("purchase_return_lines", {
      id:                  { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      return_id:           { type: Sequelize.BIGINT, allowNull: false, references: { model: "purchase_returns", key: "id" }, onDelete: "CASCADE" },
      product_id:          { type: Sequelize.BIGINT, allowNull: false, references: { model: "products", key: "id" }, onDelete: "RESTRICT" },
      po_line_id:          { type: Sequelize.BIGINT, allowNull: true,  references: { model: "purchase_order_lines", key: "id" }, onDelete: "SET NULL", comment: "PO line gốc" },
      quantity_returned:   { type: Sequelize.DECIMAL(18, 3), allowNull: false },
      quantity_confirmed:  { type: Sequelize.DECIMAL(18, 3), allowNull: false, defaultValue: 0, comment: "NCC xác nhận nhận lại" },
      quantity_rejected:   { type: Sequelize.DECIMAL(18, 3), allowNull: false, defaultValue: 0, comment: "NCC từ chối nhận" },
      unit_price:          { type: Sequelize.DECIMAL(18, 2), allowNull: false },
      line_total:          { type: Sequelize.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
      reason:              { type: Sequelize.TEXT, allowNull: true },
      condition:           { type: Sequelize.ENUM("good","damaged","defective"), allowNull: false, defaultValue: "good" },
      created_at:          { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updated_at:          { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP") },
    });
    await queryInterface.addIndex("purchase_return_lines", ["return_id"],   { name: "idx_prl_return_id" });
    await queryInterface.addIndex("purchase_return_lines", ["product_id"],  { name: "idx_prl_product_id" });
  },
  async down(queryInterface) {
    await queryInterface.dropTable("purchase_return_lines");
  },
};
