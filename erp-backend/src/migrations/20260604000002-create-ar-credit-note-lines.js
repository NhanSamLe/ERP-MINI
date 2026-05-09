"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("ar_credit_note_lines", {
      id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      credit_note_id: { type: Sequelize.BIGINT, allowNull: false, references: { model: "ar_credit_notes", key: "id" }, onDelete: "CASCADE" },
      product_id: { type: Sequelize.BIGINT, references: { model: "products", key: "id" } },
      description: { type: Sequelize.TEXT },
      quantity: { type: Sequelize.DECIMAL(18, 3), allowNull: false },
      unit_price: { type: Sequelize.DECIMAL(18, 2), allowNull: false },
      tax_rate_id: { type: Sequelize.BIGINT, references: { model: "tax_rates", key: "id" } },
      line_total: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      line_tax: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      line_total_after_tax: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP") },
    });
  },
  async down(qi) { await qi.dropTable("ar_credit_note_lines"); },
};
