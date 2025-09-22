'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('user_roles', {
      user_id: { type: Sequelize.BIGINT, primaryKey: true },
      role_id: { type: Sequelize.BIGINT, primaryKey: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });

    await queryInterface.addConstraint('user_roles', {
      fields: ['user_id'],
      type: 'foreign key',
      name: 'fk_user_roles_user',
      references: { table: 'users', field: 'id' },
      onDelete: 'CASCADE',
    });

    await queryInterface.addConstraint('user_roles', {
      fields: ['role_id'],
      type: 'foreign key',
      name: 'fk_user_roles_role',
      references: { table: 'roles', field: 'id' },
      onDelete: 'CASCADE',
    });
  },

  async down (queryInterface) {
    await queryInterface.dropTable('user_roles');
  }
};
