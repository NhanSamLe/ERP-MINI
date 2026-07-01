'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('companies', 'is_setup_done', { type: Sequelize.BOOLEAN, defaultValue: false, allowNull: false });
    await queryInterface.addColumn('companies', 'logo_url', { type: Sequelize.STRING(500), allowNull: true });
    await queryInterface.addColumn('companies', 'logo_public_id', { type: Sequelize.STRING(255), allowNull: true });
    await queryInterface.addColumn('companies', 'industry', { type: Sequelize.STRING(100), allowNull: true });
    await queryInterface.addColumn('companies', 'employee_count', { type: Sequelize.STRING(20), allowNull: true });
    await queryInterface.addColumn('companies', 'fiscal_year_start_month', { type: Sequelize.INTEGER, defaultValue: 1, allowNull: false });
    await queryInterface.addColumn('companies', 'default_currency', { type: Sequelize.STRING(10), defaultValue: 'VND', allowNull: false });
  },
  async down(queryInterface) {
    for (const col of ['is_setup_done','logo_url','logo_public_id','industry','employee_count','fiscal_year_start_month','default_currency']) {
      await queryInterface.removeColumn('companies', col);
    }
  },
};
