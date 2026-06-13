'use strict';

// Xóa unique index đơn lẻ (code) khỏi tax_rates và payment_terms
// Chỉ giữ composite unique (company_id, code) để cho phép multi-tenant

module.exports = {
  async up(queryInterface) {
    for (const table of ['tax_rates', 'payment_terms', 'uoms']) {
      try {
        await queryInterface.removeIndex(table, ['code']);
      } catch (_) {}
    }
  },

  async down(queryInterface, Sequelize) {
    for (const table of ['tax_rates', 'payment_terms', 'uoms']) {
      try {
        await queryInterface.addIndex(table, ['code'], { unique: true });
      } catch (_) {}
    }
  },
};
