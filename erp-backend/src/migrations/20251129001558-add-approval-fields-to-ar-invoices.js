"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("ar_invoices", "approval_status", {
      type: Sequelize.ENUM("draft", "waiting_approval", "approved", "rejected"),
      defaultValue: "draft",
    });

    await queryInterface.addColumn("ar_invoices", "created_by", {
      type: Sequelize.BIGINT,
      allowNull: false,
    });

    await queryInterface.addColumn("ar_invoices", "approved_by", {
      type: Sequelize.BIGINT,
      allowNull: true,
    });

    await queryInterface.addColumn("ar_invoices", "submitted_at", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn("ar_invoices", "approved_at", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn("ar_invoices", "reject_reason", {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("ar_invoices", "approval_status");
    await queryInterface.removeColumn("ar_invoices", "created_by");
    await queryInterface.removeColumn("ar_invoices", "approved_by");
    await queryInterface.removeColumn("ar_invoices", "submitted_at");
    await queryInterface.removeColumn("ar_invoices", "approved_at");
    await queryInterface.removeColumn("ar_invoices", "reject_reason");

    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_ar_invoices_approval_status";');
  },
};
