"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("sales_returns", "stock_move_id", {
      type: Sequelize.BIGINT,
      allowNull: true,
      references: {
        model: "stock_moves",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn("sales_returns", "stock_move_id");
  },
};
