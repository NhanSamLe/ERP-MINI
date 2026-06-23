'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable('gl_accounts');
    if (!tableDesc.parent_id) {
      await queryInterface.addColumn('gl_accounts', 'parent_id', {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: {
          model: 'gl_accounts',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.removeColumn('gl_accounts', 'parent_id');
    } catch (_) {}
  }
};
