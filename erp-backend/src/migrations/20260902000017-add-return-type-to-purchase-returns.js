"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("purchase_returns", "return_type", {
      type: Sequelize.ENUM("refund", "replacement", "debit_note"),
      allowNull: false,
      defaultValue: "debit_note",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("purchase_returns", "return_type");
  },
};
