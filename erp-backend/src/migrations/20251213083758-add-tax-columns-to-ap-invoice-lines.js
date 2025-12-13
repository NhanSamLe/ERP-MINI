'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // line_tax: tiền thuế từng dòng
    await queryInterface.addColumn('ap_invoice_lines', 'line_tax', {
      type: Sequelize.DECIMAL(18, 2),
      allowNull: true,
      after: 'line_total',
    });

    // line_total_after_tax: tổng sau thuế từng dòng
    await queryInterface.addColumn(
      'ap_invoice_lines',
      'line_total_after_tax',
      {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: true,
        after: 'line_tax',
      }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn(
      'ap_invoice_lines',
      'line_total_after_tax'
    );
    await queryInterface.removeColumn('ap_invoice_lines', 'line_tax');
  },
};
