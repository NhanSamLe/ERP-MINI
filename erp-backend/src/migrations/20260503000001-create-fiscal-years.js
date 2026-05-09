"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("fiscal_years", {
      id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      company_id: {
        type: Sequelize.BIGINT,
        references: { model: "companies", key: "id" },
        allowNull: true,
      },
      name: { type: Sequelize.STRING(100), allowNull: false },
      start_date: { type: Sequelize.DATEONLY, allowNull: false },
      end_date: { type: Sequelize.DATEONLY, allowNull: false },
      status: {
        type: Sequelize.ENUM("open", "closed"),
        defaultValue: "open",
      },
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
    await queryInterface.dropTable("fiscal_years");
  },
};
