'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ap_payment_allocations', {
      id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      payment_id: { type: Sequelize.BIGINT, allowNull: false },
      ap_invoice_id: { type: Sequelize.BIGINT, allowNull: false },
      applied_amount: { type: Sequelize.DECIMAL(18,2) },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
    });

    await queryInterface.addConstraint('ap_payment_allocations', {
      fields: ['payment_id'],
      type: 'foreign key',
      name: 'fk_ap_payment_allocations_payment',
      references: { table: 'ap_payments', field: 'id' },
      onDelete: 'CASCADE'
    });

    await queryInterface.addConstraint('ap_payment_allocations', {
      fields: ['ap_invoice_id'],
      type: 'foreign key',
      name: 'fk_ap_payment_allocations_invoice',
      references: { table: 'ap_invoices', field: 'id' },
      onDelete: 'CASCADE'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('ap_payment_allocations');
  }
};
