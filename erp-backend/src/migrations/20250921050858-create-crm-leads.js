'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('crm_leads', {
      id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      name: { type: Sequelize.STRING(255), allowNull: false },
      email: { type: Sequelize.STRING(100) },
      phone: { type: Sequelize.STRING(20) },
      source: { type: Sequelize.STRING(50) },
      assigned_to: { type: Sequelize.BIGINT },
      stage: { type: Sequelize.ENUM('new','qualified','lost'), defaultValue: 'new' },

      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });

    await queryInterface.addConstraint('crm_leads', {
      fields: ['assigned_to'],
      type: 'foreign key',
      name: 'fk_leads_assigned_user',
      references: { table: 'users', field: 'id' },
      onDelete: 'SET NULL',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('crm_leads');
  }
};
