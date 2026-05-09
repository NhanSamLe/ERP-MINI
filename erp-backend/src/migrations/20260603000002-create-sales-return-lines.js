"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("sales_return_lines", {
      id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      return_id: { type: Sequelize.BIGINT, allowNull: false, references: { model: "sales_returns", key: "id" }, onDelete: "CASCADE" },
      product_id: { type: Sequelize.BIGINT, allowNull: false, references: { model: "products", key: "id" } },
      quantity_returned: { type: Sequelize.DECIMAL(18, 3), allowNull: false },
      quantity_received: { type: Sequelize.DECIMAL(18, 3), defaultValue: 0 },
      quantity_rejected: { type: Sequelize.DECIMAL(18, 3), defaultValue: 0 },
      unit_price: { type: Sequelize.DECIMAL(18, 2), allowNull: false },
      line_total: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      reason: { type: Sequelize.TEXT },
      condition: { type: Sequelize.ENUM("good","damaged","defective"), defaultValue: "good" },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP") },
    });
  },
  async down(qi) { await qi.dropTable("sales_return_lines"); },
};
