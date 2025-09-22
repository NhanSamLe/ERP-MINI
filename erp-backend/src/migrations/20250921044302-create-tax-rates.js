'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tax_rates', {
      id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      code: { type: Sequelize.STRING(20), allowNull: false, unique: true },
      name: { type: Sequelize.STRING(100), allowNull: false },
      rate: { type: Sequelize.DECIMAL(5,2), allowNull: false },
      is_vat: { type: Sequelize.BOOLEAN, defaultValue: true },
      effective_date: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      status: { type: Sequelize.ENUM('active','inactive'), defaultValue: 'active' },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('tax_rates');
  }
};
