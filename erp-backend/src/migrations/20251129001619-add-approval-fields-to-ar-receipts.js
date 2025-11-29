"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("ar_receipts", "approval_status", {
      type: Sequelize.ENUM("draft", "waiting_approval", "approved", "rejected"),
      defaultValue: "draft",
    });

    await queryInterface.addColumn("ar_receipts", "created_by", {
      type: Sequelize.BIGINT,
      allowNull: false,
    });

    await queryInterface.addColumn("ar_receipts", "approved_by", {
      type: Sequelize.BIGINT,
      allowNull: true,
    });

    await queryInterface.addColumn("ar_receipts", "submitted_at", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn("ar_receipts", "approved_at", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn("ar_receipts", "reject_reason", {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("ar_receipts", "approval_status");
    await queryInterface.removeColumn("ar_receipts", "created_by");
    await queryInterface.removeColumn("ar_receipts", "approved_by");
    await queryInterface.removeColumn("ar_receipts", "submitted_at");
    await queryInterface.removeColumn("ar_receipts", "approved_at");
    await queryInterface.removeColumn("ar_receipts", "reject_reason");

    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_ar_receipts_approval_status";');
  },
};
