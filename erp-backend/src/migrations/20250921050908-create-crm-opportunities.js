'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('crm_opportunities', {
      id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      lead_id: { type: Sequelize.BIGINT },
      customer_id: { type: Sequelize.BIGINT },
      name: { type: Sequelize.STRING(255), allowNull: false },
      stage: { type: Sequelize.ENUM('prospecting','negotiation','won','lost') },
      expected_value: { type: Sequelize.DECIMAL(18,2) },
      probability: { type: Sequelize.DECIMAL(5,2) },
      owner_id: { type: Sequelize.BIGINT },

      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });

    await queryInterface.addConstraint('crm_opportunities', {
      fields: ['lead_id'],
      type: 'foreign key',
      name: 'fk_opportunity_lead',
      references: { table: 'crm_leads', field: 'id' },
      onDelete: 'SET NULL',
    });

    await queryInterface.addConstraint('crm_opportunities', {
      fields: ['customer_id'],
      type: 'foreign key',
      name: 'fk_opportunity_customer',
      references: { table: 'partners', field: 'id' },
      onDelete: 'SET NULL',
    });

    await queryInterface.addConstraint('crm_opportunities', {
      fields: ['owner_id'],
      type: 'foreign key',
      name: 'fk_opportunity_owner',
      references: { table: 'users', field: 'id' },
      onDelete: 'SET NULL',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('crm_opportunities');
  }
};
