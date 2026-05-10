"use strict";
// Cập nhật purchase_orders.price_list_id trỏ sang purchase_price_lists thay vì price_lists
// Migration trước (20260804000001) đã thêm cột price_list_id nhưng chưa có FK constraint.
// Migration này thêm FK đúng bảng.
module.exports = {
  async up(queryInterface, Sequelize) {
    // Thêm FK constraint trỏ sang purchase_price_lists
    await queryInterface.addConstraint("purchase_orders", {
      fields: ["price_list_id"],
      type: "foreign key",
      name: "fk_purchase_orders_purchase_price_list",
      references: { table: "purchase_price_lists", field: "id" },
      onDelete: "SET NULL",
    });
  },
  async down(queryInterface) {
    await queryInterface.removeConstraint("purchase_orders", "fk_purchase_orders_purchase_price_list");
  },
};
