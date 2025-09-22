'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ap_payments', {
      id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      payment_no: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      supplier_id: { type: Sequelize.BIGINT },
      payment_date: { type: Sequelize.DATE },
      amount: { type: Sequelize.DECIMAL(18,2) },
      method: { type: Sequelize.ENUM('cash','bank','transfer'), allowNull: false },
      status: { type: Sequelize.ENUM('draft','posted'), defaultValue: 'draft' },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
    });

    await queryInterface.addConstraint('ap_payments', {
      fields: ['supplier_id'],
      type: 'foreign key',
      name: 'fk_ap_payments_supplier',
      references: { table: 'partners', field: 'id' },
      onDelete: 'SET NULL'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('ap_payments');
  }
};
