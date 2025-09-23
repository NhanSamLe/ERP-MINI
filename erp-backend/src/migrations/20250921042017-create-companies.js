'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
     await queryInterface.createTable('companies', {
      id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      code: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      name: { type: Sequelize.STRING(255), allowNull: false },
      tax_code: { type: Sequelize.STRING(50) },
      address: { type: Sequelize.TEXT },
      province: { type: Sequelize.STRING(100) },
      district: { type: Sequelize.STRING(100) },
      ward: { type: Sequelize.STRING(100) },
      phone: { type: Sequelize.STRING(20) },
      email: { type: Sequelize.STRING(100) },
      website: { type: Sequelize.STRING(100) },
      bank_account: { type: Sequelize.STRING(50) },
      bank_name: { type: Sequelize.STRING(100) },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
  },

  async down (queryInterface, Sequelize) {
     await queryInterface.dropTable('companies');
  }
};
