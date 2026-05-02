"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("ar_receipts", "currency_id", {
      type: Sequelize.BIGINT,
      allowNull: true,
      references: { model: "currencies", key: "id" },
      onDelete: "SET NULL",
    });
    await queryInterface.addColumn("ar_receipts", "exchange_rate", {
      type: Sequelize.DECIMAL(18, 6),
      allowNull: false,
      defaultValue: 1.0,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("ar_receipts", "currency_id");
    await queryInterface.removeColumn("ar_receipts", "exchange_rate");
  },
};
