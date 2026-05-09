"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("fiscal_periods", {
      id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      fiscal_year_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: { model: "fiscal_years", key: "id" },
        onDelete: "CASCADE",
      },
      name: { type: Sequelize.STRING(50), allowNull: false },
      period_number: { type: Sequelize.INTEGER, allowNull: false },
      start_date: { type: Sequelize.DATEONLY, allowNull: false },
      end_date: { type: Sequelize.DATEONLY, allowNull: false },
      status: {
        type: Sequelize.ENUM("open", "closed"),
        defaultValue: "open",
      },
      closed_by: {
        type: Sequelize.BIGINT,
        references: { model: "users", key: "id" },
        allowNull: true,
      },
      closed_at: { type: Sequelize.DATE, allowNull: true },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("fiscal_periods");
  },
};
