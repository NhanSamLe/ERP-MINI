'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('gl_entries', {
      id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      journal_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: { model: 'gl_journals', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      entry_no: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      entry_date: { type: Sequelize.DATE, allowNull: false },
      reference_type: { type: Sequelize.STRING(50) },
      reference_id: { type: Sequelize.BIGINT },
      memo: { type: Sequelize.TEXT },
      status: { type: Sequelize.ENUM('draft', 'posted'), defaultValue: 'draft' },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('gl_entries');
  }
};
