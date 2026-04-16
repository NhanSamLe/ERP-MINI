"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("purchase_order_lines", "discount", {
      type: Sequelize.DECIMAL(5, 2),
      allowNull: true,
      defaultValue: 0,
      after: "unit_price",
      comment:
        "Chiết khấu theo % trên dòng đặt hàng. line_total = qty × price × (1 - discount/100)",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("purchase_order_lines", "discount");
  },
};
