'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable('gl_accounts');

    if (!tableDesc.company_id) {
      await queryInterface.addColumn('gl_accounts', 'company_id', {
        type: Sequelize.BIGINT,
        allowNull: true,
        defaultValue: null,
        after: 'id',
      });
    }

    if (!tableDesc.parent_id) {
      await queryInterface.addColumn('gl_accounts', 'parent_id', {
        type: Sequelize.BIGINT,
        allowNull: true,
        defaultValue: null,
        references: { model: 'gl_accounts', key: 'id' },
        onDelete: 'SET NULL',
      });
    }

    if (!tableDesc.is_active) {
      await queryInterface.addColumn('gl_accounts', 'is_active', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      });
    }

    if (!tableDesc.description) {
      await queryInterface.addColumn('gl_accounts', 'description', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }

    // Xóa unique index cũ trên (code) nếu còn
    try {
      await queryInterface.removeIndex('gl_accounts', ['code']);
    } catch (_) {}

    // Thêm unique composite index (company_id, code)
    try {
      await queryInterface.addIndex('gl_accounts', ['company_id', 'code'], {
        unique: true,
        name: 'gl_accounts_company_code_unique',
      });
    } catch (_) {}
  },

  async down(queryInterface) {
    try { await queryInterface.removeIndex('gl_accounts', 'gl_accounts_company_code_unique'); } catch (_) {}
    try { await queryInterface.removeColumn('gl_accounts', 'description'); } catch (_) {}
    try { await queryInterface.removeColumn('gl_accounts', 'is_active'); } catch (_) {}
    try { await queryInterface.removeColumn('gl_accounts', 'parent_id'); } catch (_) {}
    try { await queryInterface.removeColumn('gl_accounts', 'company_id'); } catch (_) {}
  },
};
