'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn("purchase_returns", "approval_status");
    await queryInterface.removeColumn("purchase_returns", "approved_by");
    await queryInterface.removeColumn("purchase_returns", "submitted_at");
    await queryInterface.removeColumn("purchase_returns", "approved_at");
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn("purchase_returns", "approval_status", {
      type: Sequelize.ENUM('draft', 'waiting_approval', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'draft',
    });
    await queryInterface.addColumn("purchase_returns", "approved_by", {
      type: Sequelize.BIGINT,
      allowNull: true,
      references: { model: "users", key: "id" },
      onDelete: "SET NULL",
    });
    await queryInterface.addColumn("purchase_returns", "submitted_at", {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn("purchase_returns", "approved_at", {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },
};
