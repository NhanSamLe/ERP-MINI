'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('sale_order_lines', {
      id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      order_id: { type: Sequelize.BIGINT, allowNull: false },
      product_id: { type: Sequelize.BIGINT },
      description: { type: Sequelize.STRING(255) },
      quantity: { type: Sequelize.DECIMAL(18,3) },
      unit_price: { type: Sequelize.DECIMAL(18,2) },
      tax_rate_id: { type: Sequelize.BIGINT },
      line_total: { type: Sequelize.DECIMAL(18,2) },

      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });

    await queryInterface.addConstraint('sale_order_lines', {
      fields: ['order_id'],
      type: 'foreign key',
      name: 'fk_sale_order_lines_order',
      references: { table: 'sale_orders', field: 'id' },
      onDelete: 'CASCADE',
    });

    await queryInterface.addConstraint('sale_order_lines', {
      fields: ['product_id'],
      type: 'foreign key',
      name: 'fk_sale_order_lines_product',
      references: { table: 'products', field: 'id' },
      onDelete: 'SET NULL',
    });

    await queryInterface.addConstraint('sale_order_lines', {
      fields: ['tax_rate_id'],
      type: 'foreign key',
      name: 'fk_sale_order_lines_tax',
      references: { table: 'tax_rates', field: 'id' },
      onDelete: 'SET NULL',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('sale_order_lines');
  }
};
