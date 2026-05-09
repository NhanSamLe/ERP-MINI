"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    const cols = {
      payment_term_id: { type: Sequelize.BIGINT, references: { model: "payment_terms", key: "id" }, allowNull: true },
      due_date: { type: Sequelize.DATEONLY, allowNull: true },
      paid_amount: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      currency_id: { type: Sequelize.BIGINT, references: { model: "currencies", key: "id" }, allowNull: true },
      exchange_rate: { type: Sequelize.DECIMAL(18, 6), defaultValue: 1.000000 },
      last_payment_date: { type: Sequelize.DATEONLY, allowNull: true },
    };
    for (const [col, def] of Object.entries(cols)) {
      await queryInterface.addColumn("ar_invoices", col, def);
    }
  },
  async down(queryInterface) {
    const cols = ["payment_term_id","due_date","paid_amount","currency_id","exchange_rate","last_payment_date"];
    for (const col of cols) await queryInterface.removeColumn("ar_invoices", col);
  },
};
