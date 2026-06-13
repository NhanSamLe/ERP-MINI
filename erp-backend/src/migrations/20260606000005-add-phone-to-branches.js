'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable('branches');

    if (!tableDesc.phone) {
      await queryInterface.addColumn('branches', 'phone', {
        type: Sequelize.STRING(20),
        allowNull: true,
        defaultValue: null,
        after: 'tax_code',
      });
    }
  },

  async down(queryInterface) {
    try { await queryInterface.removeColumn('branches', 'phone'); } catch (_) {}
  },
};
