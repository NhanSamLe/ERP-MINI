"use strict";
// Phase 5 — Nâng cấp ap_payment_audit_logs: thêm old_values, new_values
// để nhất quán với po_audit_logs
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("ap_payment_audit_logs", "old_values", {
      type: Sequelize.JSON, allowNull: true, after: "action",
    });
    await queryInterface.addColumn("ap_payment_audit_logs", "new_values", {
      type: Sequelize.JSON, allowNull: true, after: "old_values",
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn("ap_payment_audit_logs", "new_values");
    await queryInterface.removeColumn("ap_payment_audit_logs", "old_values");
  },
};
