'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('warehouses', {
      id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      branch_id: { type: Sequelize.BIGINT },
      code: { type: Sequelize.STRING(50), allowNull: false },
      name: { type: Sequelize.STRING(255), allowNull: false },
      address: { type: Sequelize.TEXT },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
    });

    await queryInterface.addConstraint('warehouses', {
      fields: ['branch_id'],
      type: 'foreign key',
      name: 'fk_warehouses_branch',
      references: { table: 'branches', field: 'id' },
      onDelete: 'SET NULL'
    });

    await queryInterface.addConstraint('warehouses', {
      fields: ['branch_id','code'],
      type: 'unique',
      name: 'uq_warehouses_branch_code'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('warehouses');
  }
};
