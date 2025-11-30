"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("purchase_orders", "status", {
      type: Sequelize.ENUM(
        "draft",
        "waiting_approval", // thêm trạng thái mới
        "confirmed",
        "partially_received",
        "completed",
        "cancelled"
      ),
      allowNull: false,
      defaultValue: "draft",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("purchase_orders", "status", {
      type: Sequelize.ENUM(
        "draft",
        "confirmed",
        "partially_received",
        "completed",
        "cancelled"
      ),
      allowNull: false,
      defaultValue: "draft",
    });
  },
};
