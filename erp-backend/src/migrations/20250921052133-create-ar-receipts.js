'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ar_receipts', {
      id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      receipt_no: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      customer_id: { type: Sequelize.BIGINT },
      receipt_date: { type: Sequelize.DATE },
      amount: { type: Sequelize.DECIMAL(18,2) },
      method: { type: Sequelize.ENUM('cash','bank','transfer'), allowNull: false },
      status: { type: Sequelize.ENUM('draft','posted'), defaultValue: 'draft' },

      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });

    await queryInterface.addConstraint('ar_receipts', {
      fields: ['customer_id'],
      type: 'foreign key',
      name: 'fk_ar_receipts_customer',
      references: { table: 'partners', field: 'id' },
      onDelete: 'SET NULL',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('ar_receipts');
  }
};
