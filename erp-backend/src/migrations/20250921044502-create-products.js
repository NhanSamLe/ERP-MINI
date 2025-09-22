'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('products', {
      id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      category_id: { type: Sequelize.BIGINT },
      sku: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      name: { type: Sequelize.STRING(255), allowNull: false },
      barcode: { type: Sequelize.STRING(100) },
      uom: { type: Sequelize.STRING(50) },
      origin: { type: Sequelize.STRING(100) },
      cost_price: { type: Sequelize.DECIMAL(18,2) },
      sale_price: { type: Sequelize.DECIMAL(18,2) },
      tax_rate_id: { type: Sequelize.BIGINT },
      status: { type: Sequelize.ENUM('active','inactive'), defaultValue: 'active' },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });

    await queryInterface.addConstraint('products', {
      fields: ['category_id'],
      type: 'foreign key',
      name: 'fk_product_category',
      references: { table: 'product_categories', field: 'id' },
      onDelete: 'SET NULL',
    });
    await queryInterface.addConstraint('products', {
      fields: ['tax_rate_id'],
      type: 'foreign key',
      name: 'fk_product_tax_rate',
      references: { table: 'tax_rates', field: 'id' },
      onDelete: 'SET NULL',
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('products');
  }
};
