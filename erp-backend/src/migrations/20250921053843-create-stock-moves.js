'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('stock_moves', {
      id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      move_no: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      move_date: { type: Sequelize.DATE, allowNull: false },
      type: { type: Sequelize.ENUM('receipt','issue','transfer','adjustment'), allowNull: false },
      warehouse_id: { type: Sequelize.BIGINT },
      reference_type: { type: Sequelize.STRING(50) },
      reference_id: { type: Sequelize.BIGINT },
      status: { type: Sequelize.ENUM('draft','posted','cancelled'), defaultValue: 'draft' },
      note: { type: Sequelize.TEXT },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
    });

    await queryInterface.addConstraint('stock_moves', {
      fields: ['warehouse_id'],
      type: 'foreign key',
      name: 'fk_stock_moves_warehouse',
      references: { table: 'warehouses', field: 'id' },
      onDelete: 'SET NULL'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('stock_moves');
  }
};
