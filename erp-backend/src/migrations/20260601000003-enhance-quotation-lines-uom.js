"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("quotation_lines", "uom_id", {
      type: Sequelize.BIGINT,
      allowNull: true,
      references: { model: "uoms", key: "id" },
      after: "product_id",
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn("quotation_lines", "uom_id");
  },
};
