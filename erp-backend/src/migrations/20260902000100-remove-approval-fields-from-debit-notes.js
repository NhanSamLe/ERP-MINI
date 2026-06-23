"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn("ap_debit_notes", "approval_status");
    await queryInterface.removeColumn("ap_debit_notes", "approved_by");
    await queryInterface.removeColumn("ap_debit_notes", "submitted_at");
    await queryInterface.removeColumn("ap_debit_notes", "approved_at");
    await queryInterface.removeColumn("ap_debit_notes", "reject_reason");
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn("ap_debit_notes", "approval_status", {
      type: Sequelize.ENUM("draft", "waiting_approval", "approved", "rejected"),
      allowNull: false,
      defaultValue: "draft",
    });
    await queryInterface.addColumn("ap_debit_notes", "approved_by", {
      type: Sequelize.BIGINT,
      allowNull: true,
      references: { model: "users", key: "id" },
      onDelete: "SET NULL",
    });
    await queryInterface.addColumn("ap_debit_notes", "submitted_at", {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn("ap_debit_notes", "approved_at", {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn("ap_debit_notes", "reject_reason", {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },
};
