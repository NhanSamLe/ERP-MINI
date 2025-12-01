"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Update ENUM status (MySQL requires full recreate)
    await queryInterface.changeColumn("stock_moves", "status", {
      type: Sequelize.ENUM("draft", "waiting_approval", "posted", "cancelled"),
      allowNull: false,
      defaultValue: "draft",
    });

    // 2. Add approval fields
    await queryInterface.addColumn("stock_moves", "created_by", {
      type: Sequelize.INTEGER,
      allowNull: false,
    });

    await queryInterface.addColumn("stock_moves", "approved_by", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.addColumn("stock_moves", "submitted_at", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn("stock_moves", "approved_at", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn("stock_moves", "reject_reason", {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    // 1. Revert ENUM
    await queryInterface.changeColumn("stock_moves", "status", {
      type: Sequelize.ENUM("draft", "posted", "cancelled"),
      allowNull: false,
      defaultValue: "draft",
    });

    // 2. Remove columns
    await queryInterface.removeColumn("stock_moves", "created_by");
    await queryInterface.removeColumn("stock_moves", "approved_by");
    await queryInterface.removeColumn("stock_moves", "submitted_at");
    await queryInterface.removeColumn("stock_moves", "approved_at");
    await queryInterface.removeColumn("stock_moves", "reject_reason");
  },
};
