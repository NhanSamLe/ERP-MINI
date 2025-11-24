'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('tax_rates', 'type', {
      type: Sequelize.ENUM(
        'VAT',
        'CIT',
        'PIT',
        'IMPORT',
        'EXPORT',
        'EXCISE',
        'ENVIRONMENTAL',
        'OTHER'
      ),
      defaultValue: 'VAT',
      allowNull: false,
    });

    await queryInterface.addColumn('tax_rates', 'applies_to', {
      type: Sequelize.ENUM('sale', 'purchase', 'both'),
      defaultValue: 'both',
      allowNull: false,
    });

    await queryInterface.addColumn('tax_rates', 'expiry_date', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('tax_rates', 'type');
    await queryInterface.removeColumn('tax_rates', 'applies_to');
    await queryInterface.removeColumn('tax_rates', 'expiry_date');

    // ⚠️ Cleanup ENUM types (Postgres)
    if (queryInterface.sequelize.getDialect() === 'postgres') {
      await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "enum_tax_rates_type";`);
      await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "enum_tax_rates_applies_to";`);
    }
  },
};
