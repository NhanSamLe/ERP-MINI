"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("price_list_items", {
      id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      price_list_id: { type: Sequelize.BIGINT, allowNull: false, references: { model: "price_lists", key: "id" }, onDelete: "CASCADE" },
      product_id: { type: Sequelize.BIGINT, allowNull: false, references: { model: "products", key: "id" } },
      min_quantity: { type: Sequelize.DECIMAL(18, 3), defaultValue: 1 },
      unit_price: { type: Sequelize.DECIMAL(18, 2), allowNull: false },
      discount_percent: { type: Sequelize.DECIMAL(5, 2), defaultValue: 0 },
      start_date: { type: Sequelize.DATEONLY, allowNull: true },
      end_date: { type: Sequelize.DATEONLY, allowNull: true },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP") },
    });
  },
  async down(qi) { await qi.dropTable("price_list_items"); },
};
