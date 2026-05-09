"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("price_lists", {
      id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      name: { type: Sequelize.STRING(100), allowNull: false },
      code: { type: Sequelize.STRING(20), unique: true },
      currency_id: { type: Sequelize.BIGINT, references: { model: "currencies", key: "id" } },
      type: { type: Sequelize.ENUM("sales","purchase"), defaultValue: "sales" },
      is_active: { type: Sequelize.TINYINT(1), defaultValue: 1 },
      start_date: { type: Sequelize.DATEONLY, allowNull: true },
      end_date: { type: Sequelize.DATEONLY, allowNull: true },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP") },
    });
  },
  async down(qi) { await qi.dropTable("price_lists"); },
};
