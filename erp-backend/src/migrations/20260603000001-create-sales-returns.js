"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("sales_returns", {
      id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      branch_id: { type: Sequelize.BIGINT, allowNull: false, references: { model: "branches", key: "id" } },
      return_no: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      rma_id: { type: Sequelize.BIGINT, references: { model: "sales_return_authorizations", key: "id" } },
      sale_order_id: { type: Sequelize.BIGINT, references: { model: "sale_orders", key: "id" } },
      customer_id: { type: Sequelize.BIGINT, allowNull: false, references: { model: "partners", key: "id" } },
      return_date: { type: Sequelize.DATEONLY, allowNull: false },
      warehouse_id: { type: Sequelize.BIGINT, references: { model: "warehouses", key: "id" } },
      status: { type: Sequelize.ENUM("draft","received","inspected","completed","cancelled"), defaultValue: "draft" },
      approval_status: { type: Sequelize.ENUM("draft","waiting_approval","approved","rejected"), defaultValue: "draft" },
      total_return_amount: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      created_by: { type: Sequelize.BIGINT, references: { model: "users", key: "id" } },
      approved_by: { type: Sequelize.BIGINT, references: { model: "users", key: "id" } },
      submitted_at: { type: Sequelize.DATE },
      approved_at: { type: Sequelize.DATE },
      notes: { type: Sequelize.TEXT },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP") },
    });
  },
  async down(qi) { await qi.dropTable("sales_returns"); },
};
