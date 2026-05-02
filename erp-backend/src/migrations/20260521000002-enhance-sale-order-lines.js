"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("sale_order_lines", "discount_percent", { type: Sequelize.DECIMAL(5, 2), defaultValue: 0 });
    await queryInterface.addColumn("sale_order_lines", "discount_amount", { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn("sale_order_lines", "discount_percent");
    await queryInterface.removeColumn("sale_order_lines", "discount_amount");
  },
};
