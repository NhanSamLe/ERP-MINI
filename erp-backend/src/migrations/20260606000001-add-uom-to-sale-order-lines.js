"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("sale_order_lines");
    if (!table.uom_id) {
      await queryInterface.addColumn("sale_order_lines", "uom_id", {
        type: Sequelize.BIGINT,
        references: { model: "uoms", key: "id" },
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable("sale_order_lines");
    if (table.uom_id) {
      await queryInterface.removeColumn("sale_order_lines", "uom_id");
    }
  },
};
