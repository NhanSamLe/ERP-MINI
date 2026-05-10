"use strict";
// Phase 4 — Thêm price_list_id vào purchase_orders
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("purchase_orders", "price_list_id", {
      type: Sequelize.BIGINT,
      allowNull: true,
      references: { model: "price_lists", key: "id" },
      onDelete: "SET NULL",
      comment: "Price list (type=purchase) áp dụng cho PO này",
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn("purchase_orders", "price_list_id");
  },
};
