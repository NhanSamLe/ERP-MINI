"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("sale_order_lines", "line_tax", {
      type: Sequelize.DECIMAL(18, 2),
      allowNull: true,
    });

    await queryInterface.addColumn("sale_order_lines", "line_total_after_tax", {
      type: Sequelize.DECIMAL(18, 2),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("sale_order_lines", "line_tax");
    await queryInterface.removeColumn("sale_order_lines", "line_total_after_tax");
  },
};
