"use strict";
// Phase 2 — Tạo bảng purchase_rfq_lines
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("purchase_rfq_lines", {
      id:                   { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      rfq_id:               { type: Sequelize.BIGINT, allowNull: false, references: { model: "purchase_rfqs", key: "id" }, onDelete: "CASCADE" },
      product_id:           { type: Sequelize.BIGINT, allowNull: false, references: { model: "products", key: "id" }, onDelete: "RESTRICT" },
      description:          { type: Sequelize.TEXT, allowNull: true },
      quantity:             { type: Sequelize.DECIMAL(18, 3), allowNull: false },
      uom_id:               { type: Sequelize.BIGINT, allowNull: true, references: { model: "uoms", key: "id" }, onDelete: "SET NULL" },
      unit_price:           { type: Sequelize.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
      discount_percent:     { type: Sequelize.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
      discount_amount:      { type: Sequelize.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
      tax_rate_id:          { type: Sequelize.BIGINT, allowNull: true, references: { model: "tax_rates", key: "id" }, onDelete: "SET NULL" },
      line_total:           { type: Sequelize.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
      line_tax:             { type: Sequelize.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
      line_total_after_tax: { type: Sequelize.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
      lead_time_days:       { type: Sequelize.INTEGER, allowNull: true, comment: "NCC cam kết giao trong N ngày" },
      created_at:           { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updated_at:           { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP") },
    });
    await queryInterface.addIndex("purchase_rfq_lines", ["rfq_id"],     { name: "idx_rfq_lines_rfq_id" });
    await queryInterface.addIndex("purchase_rfq_lines", ["product_id"], { name: "idx_rfq_lines_product_id" });
  },
  async down(queryInterface) {
    await queryInterface.dropTable("purchase_rfq_lines");
  },
};
