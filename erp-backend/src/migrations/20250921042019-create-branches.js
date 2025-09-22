'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('branches', {
      id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      company_id: { type: Sequelize.BIGINT, allowNull: false },
      code: { type: Sequelize.STRING(50), allowNull: false },
      name: { type: Sequelize.STRING(255), allowNull: false },
      address: { type: Sequelize.TEXT },
      province: { type: Sequelize.STRING(100) },
      district: { type: Sequelize.STRING(100) },
      ward: { type: Sequelize.STRING(100) },
      tax_code: { type: Sequelize.STRING(50) },
      bank_account: { type: Sequelize.STRING(50) },
      bank_name: { type: Sequelize.STRING(100) },
      status: { type: Sequelize.ENUM('active', 'inactive'), defaultValue: 'active' },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });

    await queryInterface.addConstraint('branches', {
      fields: ['company_id'],
      type: 'foreign key',
      name: 'fk_branches_company',
      references: { table: 'companies', field: 'id' },
      onDelete: 'CASCADE',
    });
  },

  async down (queryInterface) {
    await queryInterface.dropTable('branches');
  }
};
