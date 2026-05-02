"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const cols = {
      currency_id: {
        type: Sequelize.BIGINT,
        references: { model: "currencies", key: "id" },
        onDelete: "SET NULL",
        allowNull: true,
      },
      exchange_rate: {
        type: Sequelize.DECIMAL(18, 6),
        defaultValue: 1.0,
      },
    };
    for (const [col, def] of Object.entries(cols)) {
      await queryInterface.addColumn("crm_opportunities", col, def);
    }
  },

  async down(queryInterface) {
    const cols = ["currency_id", "exchange_rate"];
    for (const col of cols) {
      await queryInterface.removeColumn("crm_opportunities", col);
    }
  },
};
