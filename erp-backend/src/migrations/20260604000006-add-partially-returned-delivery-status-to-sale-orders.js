"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("sale_orders", "delivery_status", {
      type: Sequelize.ENUM("pending", "partial", "delivered", "partially_returned", "returned"),
      allowNull: true,
      defaultValue: "pending",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("sale_orders", "delivery_status", {
      type: Sequelize.ENUM("pending", "partial", "delivered", "returned"),
      allowNull: true,
      defaultValue: "pending",
    });
  },
};
