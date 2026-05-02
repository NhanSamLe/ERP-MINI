"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("gl_entries", "fiscal_period_id", {
      type: Sequelize.BIGINT,
      references: { model: "fiscal_periods", key: "id" },
      allowNull: true,
    });
    await queryInterface.addColumn("gl_entries", "branch_id", {
      type: Sequelize.BIGINT,
      references: { model: "branches", key: "id" },
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("gl_entries", "fiscal_period_id");
    await queryInterface.removeColumn("gl_entries", "branch_id");
  },
};
