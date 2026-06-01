"use strict";
// Phase 3 — Tạo bảng ap_debit_note_lines
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("ap_debit_note_lines", {
      id:                   { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      debit_note_id:        { type: Sequelize.BIGINT, allowNull: false, references: { model: "ap_debit_notes", key: "id" }, onDelete: "CASCADE" },
      product_id:           { type: Sequelize.BIGINT, allowNull: true,  references: { model: "products", key: "id" }, onDelete: "SET NULL" },
      return_line_id:       { type: Sequelize.BIGINT, allowNull: true,  references: { model: "purchase_return_lines", key: "id" }, onDelete: "SET NULL", comment: "Return line nguồn gốc" },
      description:          { type: Sequelize.TEXT, allowNull: true },
      quantity:             { type: Sequelize.DECIMAL(18, 3), allowNull: false },
      unit_price:           { type: Sequelize.DECIMAL(18, 2), allowNull: false },
      tax_rate_id:          { type: Sequelize.BIGINT, allowNull: true,  references: { model: "tax_rates", key: "id" }, onDelete: "SET NULL" },
      line_total:           { type: Sequelize.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
      line_tax:             { type: Sequelize.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
      line_total_after_tax: { type: Sequelize.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
      created_at:           { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updated_at:           { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP") },
    });
    await queryInterface.addIndex("ap_debit_note_lines", ["debit_note_id"], { name: "idx_adnl_debit_note_id" });
    await queryInterface.addIndex("ap_debit_note_lines", ["product_id"],    { name: "idx_adnl_product_id" });
  },
  async down(queryInterface) {
    await queryInterface.dropTable("ap_debit_note_lines");
  },
};
