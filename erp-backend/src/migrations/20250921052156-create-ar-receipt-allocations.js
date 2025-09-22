'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ar_receipt_allocations', {
      id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      receipt_id: { type: Sequelize.BIGINT, allowNull: false },
      invoice_id: { type: Sequelize.BIGINT, allowNull: false },
      applied_amount: { type: Sequelize.DECIMAL(18,2) },

      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });

    await queryInterface.addConstraint('ar_receipt_allocations', {
      fields: ['receipt_id'],
      type: 'foreign key',
      name: 'fk_ar_allocations_receipt',
      references: { table: 'ar_receipts', field: 'id' },
      onDelete: 'CASCADE',
    });

    await queryInterface.addConstraint('ar_receipt_allocations', {
      fields: ['invoice_id'],
      type: 'foreign key',
      name: 'fk_ar_allocations_invoice',
      references: { table: 'ar_invoices', field: 'id' },
      onDelete: 'CASCADE',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('ar_receipt_allocations');
  }
};
