"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("stock_moves", "branch_id", {
      type: Sequelize.BIGINT,
      allowNull: true,
      references: { model: "branches", key: "id" },
      onDelete: "SET NULL",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("stock_moves", "branch_id");
  },
};
