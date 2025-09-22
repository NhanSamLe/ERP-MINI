'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('crm_activities', {
      id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      related_type: { type: Sequelize.ENUM('lead','opportunity','customer'), allowNull: false },
      related_id: { type: Sequelize.BIGINT, allowNull: false },
      activity_type: { type: Sequelize.ENUM('call','email','meeting','task'), allowNull: false },
      subject: { type: Sequelize.STRING(255) },
      due_at: { type: Sequelize.DATE },
      done: { type: Sequelize.BOOLEAN, defaultValue: false },
      owner_id: { type: Sequelize.BIGINT },

      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });

    await queryInterface.addConstraint('crm_activities', {
      fields: ['owner_id'],
      type: 'foreign key',
      name: 'fk_activity_owner',
      references: { table: 'users', field: 'id' },
      onDelete: 'SET NULL',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('crm_activities');
  }
};
