'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // UOM: company_id NULL = system-wide, có giá trị = riêng công ty
    await queryInterface.addColumn('uoms', 'company_id', {
      type: Sequelize.BIGINT,
      allowNull: true,
      defaultValue: null,
      references: { model: 'companies', key: 'id' },
      onDelete: 'CASCADE',
    });

    // TaxRate: company_id NULL = national standard, có giá trị = custom của công ty
    await queryInterface.addColumn('tax_rates', 'company_id', {
      type: Sequelize.BIGINT,
      allowNull: true,
      defaultValue: null,
      references: { model: 'companies', key: 'id' },
      onDelete: 'CASCADE',
    });

    // Xóa unique constraint cũ trên code vì giờ (code, company_id) mới là unique
    // tax_rates
    try {
      await queryInterface.removeIndex('tax_rates', ['code']);
    } catch {}
    await queryInterface.addIndex('tax_rates', ['code', 'company_id'], {
      unique: true,
      name: 'tax_rates_code_company_unique',
    });

    // uoms
    try {
      await queryInterface.removeIndex('uoms', ['code']);
    } catch {}
    await queryInterface.addIndex('uoms', ['code', 'company_id'], {
      unique: true,
      name: 'uoms_code_company_unique',
    });

    // PaymentTerm: thêm company_id — mỗi công ty quản lý kỳ hạn riêng
    await queryInterface.addColumn('payment_terms', 'company_id', {
      type: Sequelize.BIGINT,
      allowNull: true,
      defaultValue: null,
      references: { model: 'companies', key: 'id' },
      onDelete: 'CASCADE',
    });

    try {
      await queryInterface.removeIndex('payment_terms', ['code']);
    } catch {}
    await queryInterface.addIndex('payment_terms', ['code', 'company_id'], {
      unique: true,
      name: 'payment_terms_code_company_unique',
    });
  },

  async down(queryInterface) {
    try { await queryInterface.removeIndex('tax_rates', 'tax_rates_code_company_unique'); } catch {}
    try { await queryInterface.removeIndex('uoms', 'uoms_code_company_unique'); } catch {}
    try { await queryInterface.removeIndex('payment_terms', 'payment_terms_code_company_unique'); } catch {}
    await queryInterface.removeColumn('uoms', 'company_id');
    await queryInterface.removeColumn('tax_rates', 'company_id');
    await queryInterface.removeColumn('payment_terms', 'company_id');
  },
};
