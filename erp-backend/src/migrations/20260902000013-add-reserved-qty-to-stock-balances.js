'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('stock_balances', 'reserved_qty', {
      type: Sequelize.DECIMAL(18, 3),
      allowNull: false,
      defaultValue: 0.000,
      comment: 'Số lượng đã giữ chỗ cho Sale Orders hoặc Transfers'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('stock_balances', 'reserved_qty');
  }
};
