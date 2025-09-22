'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('exchange_rates', {
      id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      base_currency_id: { type: Sequelize.BIGINT, allowNull: false },
      quote_currency_id: { type: Sequelize.BIGINT, allowNull: false },
      rate: { type: Sequelize.DECIMAL(18,6), allowNull: false },
      valid_date: { type: Sequelize.DATEONLY, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });

    await queryInterface.addConstraint('exchange_rates', {
      fields: ['base_currency_id'],
      type: 'foreign key',
      name: 'fk_exchange_base',
      references: { table: 'currencies', field: 'id' },
      onDelete: 'CASCADE',
    });
    await queryInterface.addConstraint('exchange_rates', {
      fields: ['quote_currency_id'],
      type: 'foreign key',
      name: 'fk_exchange_quote',
      references: { table: 'currencies', field: 'id' },
      onDelete: 'CASCADE',
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('exchange_rates');
  }
};
