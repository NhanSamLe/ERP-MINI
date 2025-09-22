'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('purchase_orders', {
      id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      branch_id: { type: Sequelize.BIGINT },
      po_no: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      supplier_id: { type: Sequelize.BIGINT },
      order_date: { type: Sequelize.DATE },
      total_before_tax: { type: Sequelize.DECIMAL(18,2) },
      total_tax: { type: Sequelize.DECIMAL(18,2) },
      total_after_tax: { type: Sequelize.DECIMAL(18,2) },
      status: {
        type: Sequelize.ENUM('draft','confirmed','received','cancelled'),
        defaultValue: 'draft'
      },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
    });

    await queryInterface.addConstraint('purchase_orders', {
      fields: ['branch_id'],
      type: 'foreign key',
      name: 'fk_purchase_orders_branch',
      references: { table: 'branches', field: 'id' },
      onDelete: 'SET NULL'
    });

    await queryInterface.addConstraint('purchase_orders', {
      fields: ['supplier_id'],
      type: 'foreign key',
      name: 'fk_purchase_orders_supplier',
      references: { table: 'partners', field: 'id' },
      onDelete: 'SET NULL'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('purchase_orders');
  }
};
