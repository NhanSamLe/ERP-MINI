"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("stock_balances", "unit_cost", {
      type: Sequelize.DECIMAL(18, 4),
      allowNull: true,
      defaultValue: 0,
      after: "quantity",
      comment: "Giá vốn đơn vị hiện tại",
    });

    await queryInterface.addColumn("stock_balances", "total_value", {
      type: Sequelize.DECIMAL(18, 2),
      allowNull: true,
      defaultValue: 0,
      after: "unit_cost",
      comment: "Tổng giá trị tồn kho = quantity × unit_cost",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("stock_balances", "total_value");
    await queryInterface.removeColumn("stock_balances", "unit_cost");
  },
};
