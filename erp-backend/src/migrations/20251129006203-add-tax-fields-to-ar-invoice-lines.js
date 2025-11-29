"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("ar_invoice_lines", "line_tax", {
      type: Sequelize.DECIMAL(18, 2),
      allowNull: true,
    });

    await queryInterface.addColumn("ar_invoice_lines", "line_total_after_tax", {
      type: Sequelize.DECIMAL(18, 2),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("ar_invoice_lines", "line_tax");
    await queryInterface.removeColumn("ar_invoice_lines", "line_total_after_tax");
  },
};
