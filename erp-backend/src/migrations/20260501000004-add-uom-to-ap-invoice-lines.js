"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("ap_invoice_lines", "uom_id", {
      type: Sequelize.BIGINT,
      allowNull: true,
      after: "quantity",
      references: { model: "uoms", key: "id" },
      onDelete: "SET NULL",
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn("ap_invoice_lines", "uom_id");
  },
};
