"use strict";
// Phase 1 — Bổ sung fields vào ap_invoices
// Thêm: payment_term_id, paid_amount, currency_id, exchange_rate, last_payment_date
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("ap_invoices", "payment_term_id", {
      type: Sequelize.BIGINT,
      allowNull: true,
      after: "due_date",
      references: { model: "payment_terms", key: "id" },
      onDelete: "SET NULL",
    });
    await queryInterface.addColumn("ap_invoices", "paid_amount", {
      type: Sequelize.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0,
      after: "total_after_tax",
    });
    await queryInterface.addColumn("ap_invoices", "currency_id", {
      type: Sequelize.BIGINT,
      allowNull: true,
      after: "paid_amount",
      references: { model: "currencies", key: "id" },
      onDelete: "SET NULL",
    });
    await queryInterface.addColumn("ap_invoices", "exchange_rate", {
      type: Sequelize.DECIMAL(18, 6),
      allowNull: false,
      defaultValue: 1.0,
      after: "currency_id",
    });
    await queryInterface.addColumn("ap_invoices", "last_payment_date", {
      type: Sequelize.DATEONLY,
      allowNull: true,
      after: "exchange_rate",
    });
    // Index hỗ trợ query "hóa đơn sắp đến hạn"
    await queryInterface.addIndex("ap_invoices", ["due_date", "status"], {
      name: "idx_ap_invoices_due_date_status",
    });
    await queryInterface.addIndex("ap_invoices", ["branch_id", "status", "paid_amount"], {
      name: "idx_ap_invoices_branch_status_paid",
    });
  },
  async down(queryInterface) {
    await queryInterface.removeIndex("ap_invoices", "idx_ap_invoices_branch_status_paid");
    await queryInterface.removeIndex("ap_invoices", "idx_ap_invoices_due_date_status");
    for (const col of ["last_payment_date", "exchange_rate", "currency_id", "paid_amount", "payment_term_id"]) {
      await queryInterface.removeColumn("ap_invoices", col);
    }
  },
};
