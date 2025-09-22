'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('stock_balances', {
      id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      warehouse_id: { type: Sequelize.BIGINT, allowNull: false },
      product_id: { type: Sequelize.BIGINT, allowNull: false },
      quantity: { type: Sequelize.DECIMAL(18,3), defaultValue: 0 },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
    });

    await queryInterface.addConstraint('stock_balances', {
      fields: ['warehouse_id'],
      type: 'foreign key',
      name: 'fk_stock_balances_warehouse',
      references: { table: 'warehouses', field: 'id' },
      onDelete: 'CASCADE'
    });

    await queryInterface.addConstraint('stock_balances', {
      fields: ['product_id'],
      type: 'foreign key',
      name: 'fk_stock_balances_product',
      references: { table: 'products', field: 'id' },
      onDelete: 'CASCADE'
    });

    await queryInterface.addConstraint('stock_balances', {
      fields: ['warehouse_id','product_id'],
      type: 'unique',
      name: 'uq_stock_balances_warehouse_product'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('stock_balances');
  }
};
