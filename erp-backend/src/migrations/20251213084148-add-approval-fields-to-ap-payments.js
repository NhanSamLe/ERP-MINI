"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // approval_status
    await queryInterface.addColumn("ap_payments", "approval_status", {
      type: Sequelize.ENUM("draft", "waiting_approval", "approved", "rejected"),
      allowNull: false,
      defaultValue: "draft",
      after: "status",
    });

    // created_by
    await queryInterface.addColumn("ap_payments", "created_by", {
      type: Sequelize.BIGINT,
      allowNull: false,
      after: "approval_status",
    });

    // approved_by
    await queryInterface.addColumn("ap_payments", "approved_by", {
      type: Sequelize.BIGINT,
      allowNull: true,
      after: "created_by",
    });

    // submitted_at
    await queryInterface.addColumn("ap_payments", "submitted_at", {
      type: Sequelize.DATE,
      allowNull: true,
      after: "approved_by",
    });

    // approved_at
    await queryInterface.addColumn("ap_payments", "approved_at", {
      type: Sequelize.DATE,
      allowNull: true,
      after: "submitted_at",
    });

    // reject_reason
    await queryInterface.addColumn("ap_payments", "reject_reason", {
      type: Sequelize.STRING(255),
      allowNull: true,
      after: "approved_at",
    });

    // branch_id (default = 1 để tránh lỗi allowNull)
    await queryInterface.addColumn("ap_payments", "branch_id", {
      type: Sequelize.BIGINT,
      allowNull: false,
      defaultValue: 1,
      after: "reject_reason",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("ap_payments", "branch_id");
    await queryInterface.removeColumn("ap_payments", "reject_reason");
    await queryInterface.removeColumn("ap_payments", "approved_at");
    await queryInterface.removeColumn("ap_payments", "submitted_at");
    await queryInterface.removeColumn("ap_payments", "approved_by");
    await queryInterface.removeColumn("ap_payments", "created_by");
    await queryInterface.removeColumn("ap_payments", "approval_status");

    // ⚠ MySQL cleanup ENUM
    await queryInterface.sequelize.query(`
      ALTER TABLE ap_payments 
      MODIFY approval_status VARCHAR(50);
    `);
  },
};
