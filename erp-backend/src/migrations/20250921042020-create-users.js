'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      branch_id: { type: Sequelize.BIGINT },
      username: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      password_hash: { type: Sequelize.STRING(255), allowNull: false },
      full_name: { type: Sequelize.STRING(100) },
      email: { type: Sequelize.STRING(100) },
      phone: { type: Sequelize.STRING(20) },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      reset_token: { type: Sequelize.STRING(255) },
      reset_expires_at: { type: Sequelize.DATE },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });

    await queryInterface.addConstraint('users', {
      fields: ['branch_id'],
      type: 'foreign key',
      name: 'fk_users_branch',
      references: { table: 'branches', field: 'id' },
      onDelete: 'SET NULL',
    });
  },

  async down (queryInterface) {
    await queryInterface.dropTable('users');
  }
};
