"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("ar_refunds");
    if (!table.currency_id) {
      await queryInterface.addColumn("ar_refunds", "currency_id", {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: { model: "currencies", key: "id" },
        onDelete: "SET NULL",
      });
    }
    if (!table.exchange_rate) {
      await queryInterface.addColumn("ar_refunds", "exchange_rate", {
        type: Sequelize.DECIMAL(18, 6),
        allowNull: false,
        defaultValue: 1.0,
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable("ar_refunds");
    if (table.exchange_rate) await queryInterface.removeColumn("ar_refunds", "exchange_rate");
    if (table.currency_id) await queryInterface.removeColumn("ar_refunds", "currency_id");
  },
};
