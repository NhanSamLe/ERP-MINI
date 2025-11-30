"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Thay đổi ENUM status
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

    // 2. Thêm các cột mới
    await queryInterface.addColumn("purchase_orders", "created_by", {
      type: Sequelize.INTEGER,
      allowNull: false,
    });

    await queryInterface.addColumn("purchase_orders", "approved_by", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.addColumn("purchase_orders", "submitted_at", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn("purchase_orders", "approved_at", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn("purchase_orders", "reject_reason", {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    // rollback ENUM
    await queryInterface.changeColumn("purchase_orders", "status", {
      type: Sequelize.ENUM("draft", "confirmed", "received", "cancelled"),
      allowNull: false,
      defaultValue: "draft",
    });

    // rollback delete columns
    await queryInterface.removeColumn("purchase_orders", "created_by");
    await queryInterface.removeColumn("purchase_orders", "approved_by");
    await queryInterface.removeColumn("purchase_orders", "submitted_at");
    await queryInterface.removeColumn("purchase_orders", "approved_at");
    await queryInterface.removeColumn("purchase_orders", "reject_reason");
  },
};
