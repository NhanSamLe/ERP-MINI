"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("stock_moves", "reference_type", {
      type: Sequelize.ENUM(
        "purchase_order",
        "sale_order",
        "transfer",
        "adjustment",
        "purchase_return",
        "sales_return"
      ),
      allowNull: true,
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("stock_moves", "reference_type", {
      type: Sequelize.ENUM(
        "purchase_order",
        "sale_order",
        "transfer",
        "adjustment"
      ),
      allowNull: true,
    });
  },
};
