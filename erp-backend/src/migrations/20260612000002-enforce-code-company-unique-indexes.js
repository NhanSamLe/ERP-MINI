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

async function deduplicateTable(queryInterface, table) {
  const sequelize = queryInterface.sequelize;
  const dialect = sequelize.options.dialect;
  const isMySQL = dialect === 'mysql' || dialect === 'mysql2';

  // Find duplicate code & company_id pairs
  const [duplicates] = await sequelize.query(`
    SELECT code, company_id, COUNT(*) as count 
    FROM \`${table}\` 
    GROUP BY code, company_id 
    HAVING count > 1
  `);

  if (duplicates.length === 0) return;

  for (const dup of duplicates) {
    // Get all IDs ordered by id
    const [rows] = await sequelize.query(`
      SELECT id FROM \`${table}\` 
      WHERE code = :code AND company_id = :company_id 
      ORDER BY id ASC
    `, {
      replacements: { code: dup.code, company_id: dup.company_id }
    });

    const ids = rows.map(r => r.id);
    const keepId = ids[0];
    const deleteIds = ids.slice(1);

    if (isMySQL) {
      const [[{ db_name }]] = await sequelize.query('SELECT DATABASE() as db_name');
      // Find foreign keys referencing this table
      const [fks] = await sequelize.query(`
        SELECT TABLE_NAME, COLUMN_NAME
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
        WHERE REFERENCED_TABLE_NAME = :table AND TABLE_SCHEMA = :database
      `, {
        replacements: { table, database: db_name }
      });

      // Update referencing tables
      for (const fk of fks) {
        await sequelize.query(`
          UPDATE \`${fk.TABLE_NAME}\` 
          SET \`${fk.COLUMN_NAME}\` = :keepId 
          WHERE \`${fk.COLUMN_NAME}\` IN (:deleteIds)
        `, {
          replacements: { keepId, deleteIds }
        });
      }
    }

    // Delete duplicate rows
    await sequelize.query(`
      DELETE FROM \`${table}\` 
      WHERE id IN (:deleteIds)
    `, {
      replacements: { deleteIds }
    });
  }
}

module.exports = {
  async up(queryInterface) {
    for (const { table, indexName } of CODE_COMPANY_TABLES) {
      await deduplicateTable(queryInterface, table);

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

