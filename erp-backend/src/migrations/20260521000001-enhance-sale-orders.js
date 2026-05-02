"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    const cols = {
      quotation_id: { type: Sequelize.BIGINT, references: { model: "quotations", key: "id" }, allowNull: true },
      currency_id: { type: Sequelize.BIGINT, references: { model: "currencies", key: "id" }, allowNull: true },
      exchange_rate: { type: Sequelize.DECIMAL(18, 6), defaultValue: 1.000000 },
      payment_term_id: { type: Sequelize.BIGINT, references: { model: "payment_terms", key: "id" }, allowNull: true },
      discount_percent: { type: Sequelize.DECIMAL(5, 2), defaultValue: 0 },
      discount_amount: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      delivery_status: { type: Sequelize.ENUM("pending","partial","delivered"), defaultValue: "pending" },
      invoice_status: { type: Sequelize.ENUM("not_invoiced","partial","invoiced"), defaultValue: "not_invoiced" },
      customer_po_number: { type: Sequelize.STRING(100), allowNull: true },
      delivery_address: { type: Sequelize.TEXT, allowNull: true },
      expected_delivery_date: { type: Sequelize.DATEONLY, allowNull: true },
      sales_person_id: { type: Sequelize.BIGINT, references: { model: "users", key: "id" }, allowNull: true },
      internal_notes: { type: Sequelize.TEXT, allowNull: true },
      customer_notes: { type: Sequelize.TEXT, allowNull: true },
    };
    for (const [col, def] of Object.entries(cols)) {
      await queryInterface.addColumn("sale_orders", col, def);
    }
  },
  async down(queryInterface) {
    const cols = ["quotation_id","currency_id","exchange_rate","payment_term_id","discount_percent","discount_amount","delivery_status","invoice_status","customer_po_number","delivery_address","expected_delivery_date","sales_person_id","internal_notes","customer_notes"];
    for (const col of cols) await queryInterface.removeColumn("sale_orders", col);
  },
};
