'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('gl_entry_lines', {
      id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      entry_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: { model: 'gl_entries', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      account_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: { model: 'gl_accounts', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      partner_id: {
        type: Sequelize.BIGINT,
        references: { model: 'partners', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      debit: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      credit: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('gl_entry_lines');
  }
};
