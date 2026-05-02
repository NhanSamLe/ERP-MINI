"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("ar_receipts", "bank_account_id", {
      type: Sequelize.BIGINT, references: { model: "bank_accounts", key: "id" }, allowNull: true,
    });
    await queryInterface.addColumn("ar_receipts", "transaction_reference", {
      type: Sequelize.STRING(100), allowNull: true,
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn("ar_receipts", "bank_account_id");
    await queryInterface.removeColumn("ar_receipts", "transaction_reference");
  },
};
