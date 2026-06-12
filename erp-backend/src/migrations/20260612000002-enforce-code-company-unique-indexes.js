'use strict';

const CODE_COMPANY_TABLES = [
  { table: 'branches', indexName: 'branches_code_company_unique' },
  { table: 'gl_accounts', indexName: 'gl_accounts_code_company_unique' },
  { table: 'gl_journals', indexName: 'gl_journals_code_company_unique' },
  { table: 'tax_rates', indexName: 'tax_rates_code_company_unique' },
  { table: 'payment_terms', indexName: 'payment_terms_code_company_unique' },
  { table: 'uoms', indexName: 'uoms_code_company_unique' },
];

function getIndexFields(index) {
  return (index.fields || [])
    .map((field) => field.attribute || field.name)
    .filter(Boolean);
}

function hasCodeCompanyUnique(indexes) {
  return indexes.some((index) => {
    const fields = getIndexFields(index);
    return (
      index.unique === true &&
      fields.length === 2 &&
      fields.includes('code') &&
      fields.includes('company_id')
    );
  });
}

function getSingleCodeUniqueIndexes(indexes) {
  return indexes.filter((index) => {
    const fields = getIndexFields(index);
    return index.unique === true && fields.length === 1 && fields[0] === 'code';
  });
}

module.exports = {
  async up(queryInterface) {
    for (const { table, indexName } of CODE_COMPANY_TABLES) {
      const indexes = await queryInterface.showIndex(table);

      for (const index of getSingleCodeUniqueIndexes(indexes)) {
        await queryInterface.removeIndex(table, index.name);
      }

      if (!hasCodeCompanyUnique(indexes)) {
        await queryInterface.addIndex(table, ['code', 'company_id'], {
          unique: true,
          name: indexName,
        });
      }
    }
  },

  async down(queryInterface) {
    for (const { table, indexName } of CODE_COMPANY_TABLES) {
      try {
        await queryInterface.removeIndex(table, indexName);
      } catch (_) {}
    }
  },
};
