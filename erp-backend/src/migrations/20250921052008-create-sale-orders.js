'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('sale_orders', {
      id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      branch_id: { type: Sequelize.BIGINT },
      order_no: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      customer_id: { type: Sequelize.BIGINT },
      order_date: { type: Sequelize.DATE },
      status: { type: Sequelize.ENUM('draft','confirmed','shipped','completed','cancelled'), defaultValue: 'draft' },
      total_before_tax: { type: Sequelize.DECIMAL(18,2) },
      total_tax: { type: Sequelize.DECIMAL(18,2) },
      total_after_tax: { type: Sequelize.DECIMAL(18,2) },

      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });

    await queryInterface.addConstraint('sale_orders', {
      fields: ['branch_id'],
      type: 'foreign key',
      name: 'fk_sale_orders_branch',
      references: { table: 'branches', field: 'id' },
      onDelete: 'SET NULL',
    });

    await queryInterface.addConstraint('sale_orders', {
      fields: ['customer_id'],
      type: 'foreign key',
      name: 'fk_sale_orders_customer',
      references: { table: 'partners', field: 'id' },
      onDelete: 'SET NULL',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('sale_orders');
  }
};
