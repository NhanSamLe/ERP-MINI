"use strict";
// Phase 1 — Bổ sung fields vào ap_payments
// Thêm: allocation_status, currency_id, exchange_rate, bank_account_id, transaction_reference
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("ap_payments", "allocation_status", {
      type: Sequelize.ENUM("unallocated", "partially_allocated", "fully_allocated"),
      allowNull: false,
      defaultValue: "unallocated",
      after: "status",
    });
    await queryInterface.addColumn("ap_payments", "currency_id", {
      type: Sequelize.BIGINT,
      allowNull: true,
      references: { model: "currencies", key: "id" },
      onDelete: "SET NULL",
    });
    await queryInterface.addColumn("ap_payments", "exchange_rate", {
      type: Sequelize.DECIMAL(18, 6),
      allowNull: false,
      defaultValue: 1.0,
    });
    await queryInterface.addColumn("ap_payments", "bank_account_id", {
      type: Sequelize.BIGINT,
      allowNull: true,
      references: { model: "bank_accounts", key: "id" },
      onDelete: "SET NULL",
    });
    await queryInterface.addColumn("ap_payments", "transaction_reference", {
      type: Sequelize.STRING(100),
      allowNull: true,
    });
    await queryInterface.addIndex("ap_payments", ["branch_id", "allocation_status"], {
      name: "idx_ap_payments_branch_allocation",
    });
  },
  async down(queryInterface) {
    await queryInterface.removeIndex("ap_payments", "idx_ap_payments_branch_allocation");
    for (const col of ["transaction_reference", "bank_account_id", "exchange_rate", "currency_id"]) {
      await queryInterface.removeColumn("ap_payments", col);
    }
    await queryInterface.removeColumn("ap_payments", "allocation_status");
    await queryInterface.sequelize.query(
      "ALTER TABLE ap_payments MODIFY allocation_status VARCHAR(50)"
    );
  },
};
