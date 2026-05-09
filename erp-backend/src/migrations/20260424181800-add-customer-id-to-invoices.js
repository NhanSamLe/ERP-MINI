"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("ar_invoices", "customer_id", {
      type: Sequelize.BIGINT,
      allowNull: true,
      references: { model: "partners", key: "id" },
      onDelete: "SET NULL",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("ar_invoices", "customer_id");
  },
};
