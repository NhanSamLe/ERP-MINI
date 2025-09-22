'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('partners', {
      id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      type: { type: Sequelize.ENUM('customer','supplier','internal'), allowNull: false },
      name: { type: Sequelize.STRING(255), allowNull: false },
      contact_person: { type: Sequelize.STRING(100) },
      phone: { type: Sequelize.STRING(20) },
      email: { type: Sequelize.STRING(100) },
      tax_code: { type: Sequelize.STRING(50) },
      cccd: { type: Sequelize.STRING(20) },
      address: { type: Sequelize.TEXT },
      province: { type: Sequelize.STRING(100) },
      district: { type: Sequelize.STRING(100) },
      ward: { type: Sequelize.STRING(100) },
      bank_account: { type: Sequelize.STRING(50) },
      bank_name: { type: Sequelize.STRING(100) },
      status: { type: Sequelize.ENUM('active','inactive'), allowNull: false, defaultValue: 'active' },

      // timestamps
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('partners');
  }
};
