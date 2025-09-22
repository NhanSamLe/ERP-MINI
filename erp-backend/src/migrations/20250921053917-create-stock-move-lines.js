'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('stock_move_lines', {
      id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      move_id: { type: Sequelize.BIGINT, allowNull: false },
      product_id: { type: Sequelize.BIGINT, allowNull: false },
      quantity: { type: Sequelize.DECIMAL(18,3) },
      uom: { type: Sequelize.STRING(50) },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
    });

    await queryInterface.addConstraint('stock_move_lines', {
      fields: ['move_id'],
      type: 'foreign key',
      name: 'fk_stock_move_lines_move',
      references: { table: 'stock_moves', field: 'id' },
      onDelete: 'CASCADE'
    });

    await queryInterface.addConstraint('stock_move_lines', {
      fields: ['product_id'],
      type: 'foreign key',
      name: 'fk_stock_move_lines_product',
      references: { table: 'products', field: 'id' },
      onDelete: 'CASCADE'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('stock_move_lines');
  }
};
