"use strict";
// Phase 1 — Bổ sung fields vào purchase_orders
// Thêm: currency_id, exchange_rate, payment_term_id, discount_percent, discount_amount,
//        receipt_status, invoice_status, supplier_ref_no, delivery_address,
//        expected_delivery_date, buyer_id, internal_notes, supplier_notes
module.exports = {
  async up(queryInterface, Sequelize) {
    const cols = [
      ["currency_id",            { type: Sequelize.BIGINT, allowNull: true, references: { model: "currencies", key: "id" }, onDelete: "SET NULL" }],
      ["exchange_rate",          { type: Sequelize.DECIMAL(18, 6), allowNull: false, defaultValue: 1.0 }],
      ["payment_term_id",        { type: Sequelize.BIGINT, allowNull: true, references: { model: "payment_terms", key: "id" }, onDelete: "SET NULL" }],
      ["discount_percent",       { type: Sequelize.DECIMAL(5, 2), allowNull: false, defaultValue: 0 }],
      ["discount_amount",        { type: Sequelize.DECIMAL(18, 2), allowNull: false, defaultValue: 0 }],
      ["receipt_status",         { type: Sequelize.ENUM("pending", "partial", "fully_received"), allowNull: false, defaultValue: "pending" }],
      ["invoice_status",         { type: Sequelize.ENUM("not_invoiced", "partial", "invoiced"), allowNull: false, defaultValue: "not_invoiced" }],
      ["supplier_ref_no",        { type: Sequelize.STRING(100), allowNull: true }],
      ["delivery_address",       { type: Sequelize.TEXT, allowNull: true }],
      ["expected_delivery_date", { type: Sequelize.DATEONLY, allowNull: true }],
      ["buyer_id",               { type: Sequelize.BIGINT, allowNull: true, references: { model: "users", key: "id" }, onDelete: "SET NULL" }],
      ["internal_notes",         { type: Sequelize.TEXT, allowNull: true }],
      ["supplier_notes",         { type: Sequelize.TEXT, allowNull: true }],
    ];
    for (const [col, def] of cols) {
      await queryInterface.addColumn("purchase_orders", col, def);
    }
    await queryInterface.addIndex("purchase_orders", ["branch_id", "receipt_status"], {
      name: "idx_po_branch_receipt_status",
    });
    await queryInterface.addIndex("purchase_orders", ["branch_id", "invoice_status"], {
      name: "idx_po_branch_invoice_status",
    });
    await queryInterface.addIndex("purchase_orders", ["expected_delivery_date"], {
      name: "idx_po_expected_delivery_date",
    });
    await queryInterface.addIndex("purchase_orders", ["buyer_id"], {
      name: "idx_po_buyer_id",
    });
  },
  async down(queryInterface) {
    await queryInterface.removeIndex("purchase_orders", "idx_po_buyer_id");
    await queryInterface.removeIndex("purchase_orders", "idx_po_expected_delivery_date");
    await queryInterface.removeIndex("purchase_orders", "idx_po_branch_invoice_status");
    await queryInterface.removeIndex("purchase_orders", "idx_po_branch_receipt_status");
    const cols = ["supplier_notes","internal_notes","buyer_id","expected_delivery_date",
      "delivery_address","supplier_ref_no","invoice_status","receipt_status",
      "discount_amount","discount_percent","payment_term_id","exchange_rate","currency_id"];
    for (const col of cols) {
      await queryInterface.removeColumn("purchase_orders", col);
    }
    await queryInterface.sequelize.query(
      "ALTER TABLE purchase_orders MODIFY receipt_status VARCHAR(50), MODIFY invoice_status VARCHAR(50)"
    );
  },
};
