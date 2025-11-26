"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("purchase_orders", "description", {
      type: Sequelize.TEXT,
      allowNull: true,
      defaultValue: null,
      after: "order_date", // nếu dùng MySQL, muốn đặt vị trí
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("purchase_orders", "description");
  },
};
