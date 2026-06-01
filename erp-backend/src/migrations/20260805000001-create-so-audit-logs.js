"use strict";
// Phase 5 — Tạo so_audit_logs (Sale Order audit log — đối xứng với po_audit_logs)
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("so_audit_logs", {
      id:         { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      so_id:      { type: Sequelize.BIGINT, allowNull: false, references: { model: "sale_orders", key: "id" }, onDelete: "CASCADE" },
      action:     { type: Sequelize.STRING(50), allowNull: false, comment: "CREATE, UPDATE, APPROVE, CANCEL, SHIP..." },
      old_values: { type: Sequelize.JSON, allowNull: true },
      new_values: { type: Sequelize.JSON, allowNull: true },
      changed_by: { type: Sequelize.BIGINT, allowNull: false, references: { model: "users", key: "id" }, onDelete: "RESTRICT" },
      changed_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      branch_id:  { type: Sequelize.BIGINT, allowNull: false, references: { model: "branches", key: "id" }, onDelete: "RESTRICT" },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP") },
    });
    await queryInterface.addIndex("so_audit_logs", ["so_id"],       { name: "idx_so_audit_so_id" });
    await queryInterface.addIndex("so_audit_logs", ["changed_by"],  { name: "idx_so_audit_changed_by" });
    await queryInterface.addIndex("so_audit_logs", ["changed_at"],  { name: "idx_so_audit_changed_at" });
    await queryInterface.addIndex("so_audit_logs", ["branch_id"],   { name: "idx_so_audit_branch_id" });
    await queryInterface.addIndex("so_audit_logs", ["so_id", "changed_at"], { name: "idx_so_audit_so_id_changed_at" });
  },
  async down(queryInterface) { await queryInterface.dropTable("so_audit_logs"); },
};
