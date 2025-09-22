'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ap_invoices', {
      id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      po_id: { type: Sequelize.BIGINT },
      invoice_no: { type: Sequelize.STRING(50), allowNull: false },
      invoice_date: { type: Sequelize.DATE },
      due_date: { type: Sequelize.DATE },
      total_before_tax: { type: Sequelize.DECIMAL(18,2) },
      total_tax: { type: Sequelize.DECIMAL(18,2) },
      total_after_tax: { type: Sequelize.DECIMAL(18,2) },
      status: {
        type: Sequelize.ENUM('draft','posted','paid','cancelled'),
        defaultValue: 'draft'
      },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
    });

    await queryInterface.addConstraint('ap_invoices', {
      fields: ['po_id'],
      type: 'foreign key',
      name: 'fk_ap_invoices_po',
      references: { table: 'purchase_orders', field: 'id' },
      onDelete: 'SET NULL'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('ap_invoices');
  }
};
