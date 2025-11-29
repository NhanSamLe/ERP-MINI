"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("sale_orders", "approval_status", {
      type: Sequelize.ENUM("draft", "waiting_approval", "approved", "rejected"),
      defaultValue: "draft",
    });

    await queryInterface.addColumn("sale_orders", "created_by", {
      type: Sequelize.BIGINT,
      allowNull: false,
    });

    await queryInterface.addColumn("sale_orders", "approved_by", {
      type: Sequelize.BIGINT,
      allowNull: true,
    });

    await queryInterface.addColumn("sale_orders", "submitted_at", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn("sale_orders", "approved_at", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn("sale_orders", "reject_reason", {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("sale_orders", "approval_status");
    await queryInterface.removeColumn("sale_orders", "created_by");
    await queryInterface.removeColumn("sale_orders", "approved_by");
    await queryInterface.removeColumn("sale_orders", "submitted_at");
    await queryInterface.removeColumn("sale_orders", "approved_at");
    await queryInterface.removeColumn("sale_orders", "reject_reason");

    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_sale_orders_approval_status";');
  },
};
