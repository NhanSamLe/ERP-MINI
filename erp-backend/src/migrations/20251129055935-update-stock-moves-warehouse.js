"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Remove old warehouse_id column
    await queryInterface.removeColumn("stock_moves", "warehouse_id");

    // 2. Add warehouse_from_id
    await queryInterface.addColumn("stock_moves", "warehouse_from_id", {
      type: Sequelize.BIGINT,
      allowNull: true,
    });

    // 3. Add warehouse_to_id
    await queryInterface.addColumn("stock_moves", "warehouse_to_id", {
      type: Sequelize.BIGINT,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    // Rollback: remove new columns
    await queryInterface.removeColumn("stock_moves", "warehouse_from_id");
    await queryInterface.removeColumn("stock_moves", "warehouse_to_id");

    // Restore old warehouse_id
    await queryInterface.addColumn("stock_moves", "warehouse_id", {
      type: Sequelize.BIGINT,
      allowNull: true,
    });
  },
};
