'use strict';

const MULTI_TENANT_CODE_TABLES = [
  'gl_accounts',
  'tax_rates',
  'payment_terms',
  'uoms',
];

function getIndexFields(index) {
  return (index.fields || [])
    .map((field) => field.attribute || field.name)
    .filter(Boolean);
}

module.exports = {
  async up(queryInterface) {
    for (const table of MULTI_TENANT_CODE_TABLES) {
      const indexes = await queryInterface.showIndex(table);
      const singleCodeUniqueIndexes = indexes.filter((index) => {
        const fields = getIndexFields(index);
        return index.unique === true && fields.length === 1 && fields[0] === 'code';
      });

      for (const index of singleCodeUniqueIndexes) {
        await queryInterface.removeIndex(table, index.name);
      }
    }
  },

  async down() {
    // Intentionally left empty: re-adding global unique(code) would break existing
    // per-company seed data that legitimately reuses the same codes.
  },
};
