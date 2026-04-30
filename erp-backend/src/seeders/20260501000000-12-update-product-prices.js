"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      UPDATE products SET cost_price = 18000000, sale_price = 22990000, updated_at = NOW() WHERE sku = 'LAP001';
    `);
    await queryInterface.sequelize.query(`
      UPDATE products SET cost_price = 22000000, sale_price = 27990000, updated_at = NOW() WHERE sku = 'PHN001';
    `);
    await queryInterface.sequelize.query(`
      UPDATE products SET cost_price = 12000000, sale_price = 16990000, updated_at = NOW() WHERE sku = 'TV001';
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      UPDATE products SET cost_price = 500.00, sale_price = 650.00, updated_at = NOW() WHERE sku = 'LAP001';
    `);
    await queryInterface.sequelize.query(`
      UPDATE products SET cost_price = 900.00, sale_price = 1200.00, updated_at = NOW() WHERE sku = 'PHN001';
    `);
    await queryInterface.sequelize.query(`
      UPDATE products SET cost_price = 400.00, sale_price = 600.00, updated_at = NOW() WHERE sku = 'TV001';
    `);
  },
};
