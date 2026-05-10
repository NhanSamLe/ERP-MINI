"use strict";
// Phase 2 — Thêm rfq_id vào purchase_orders (link PO với RFQ nguồn gốc)
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("purchase_orders", "rfq_id", {
      type: Sequelize.BIGINT,
      allowNull: true,
      after: "branch_id",
      references: { model: "purchase_rfqs", key: "id" },
      onDelete: "SET NULL",
      comment: "RFQ nguồn gốc tạo ra PO này",
    });
    await queryInterface.addIndex("purchase_orders", ["rfq_id"], {
      name: "idx_po_rfq_id",
    });
  },
  async down(queryInterface) {
    await queryInterface.removeIndex("purchase_orders", "idx_po_rfq_id");
    await queryInterface.removeColumn("purchase_orders", "rfq_id");
  },
};
