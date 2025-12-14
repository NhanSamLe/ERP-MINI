"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("purchase_order_lines", "line_tax", {
      type: Sequelize.DECIMAL(18, 2),
      allowNull: true,
      comment: "VAT amount for each purchase order line",
    });

    await queryInterface.addColumn(
      "purchase_order_lines",
      "line_total_after_tax",
      {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: true,
        comment: "Total amount after tax for each purchase order line",
      }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("purchase_order_lines", "line_tax");

    await queryInterface.removeColumn(
      "purchase_order_lines",
      "line_total_after_tax"
    );
  },
};
