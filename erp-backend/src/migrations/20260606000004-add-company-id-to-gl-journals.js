'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable('gl_journals');

    if (!tableDesc.company_id) {
      await queryInterface.addColumn('gl_journals', 'company_id', {
        type: Sequelize.BIGINT,
        allowNull: true,
        defaultValue: null,
        references: { model: 'companies', key: 'id' },
        onDelete: 'CASCADE',
      });
    }

    try {
      await queryInterface.addIndex('gl_journals', ['company_id'], {
        name: 'gl_journals_company_id_idx',
      });
    } catch (_) {}
  },

  async down(queryInterface) {
    try { await queryInterface.removeIndex('gl_journals', 'gl_journals_company_id_idx'); } catch (_) {}
    try { await queryInterface.removeColumn('gl_journals', 'company_id'); } catch (_) {}
  },
};
