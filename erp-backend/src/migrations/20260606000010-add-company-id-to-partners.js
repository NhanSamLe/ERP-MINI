'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable('partners');
    if (!tableDesc.company_id) {
      await queryInterface.addColumn('partners', 'company_id', {
        type: Sequelize.BIGINT,
        allowNull: true,
        defaultValue: null,
        after: 'id',
      });
    }
  },
  async down(queryInterface) {
    try { await queryInterface.removeColumn('partners', 'company_id'); } catch (_) {}
  },
};
