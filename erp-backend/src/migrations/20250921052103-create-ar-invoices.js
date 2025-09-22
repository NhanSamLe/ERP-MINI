'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ar_invoices', {
      id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      order_id: { type: Sequelize.BIGINT },
      invoice_no: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      invoice_date: { type: Sequelize.DATE },
      total_before_tax: { type: Sequelize.DECIMAL(18,2) },
      total_tax: { type: Sequelize.DECIMAL(18,2) },
      total_after_tax: { type: Sequelize.DECIMAL(18,2) },
      status: { type: Sequelize.ENUM('draft','posted','paid','cancelled'), defaultValue: 'draft' },

      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });

    await queryInterface.addConstraint('ar_invoices', {
      fields: ['order_id'],
      type: 'foreign key',
      name: 'fk_ar_invoices_order',
      references: { table: 'sale_orders', field: 'id' },
      onDelete: 'SET NULL',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('ar_invoices');
  }
};
