"use strict";
// Phase 1 — Bổ sung fields vào purchase_order_lines
// Rename: discount → discount_percent
// Thêm: discount_amount, description, qty_received, qty_invoiced
module.exports = {
  async up(queryInterface, Sequelize) {
    // Rename discount → discount_percent để nhất quán với sale_order_lines
    await queryInterface.renameColumn("purchase_order_lines", "discount", "discount_percent");

    await queryInterface.addColumn("purchase_order_lines", "discount_amount", {
      type: Sequelize.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0,
      comment: "Chiết khấu tuyệt đối trên dòng",
    });
    await queryInterface.addColumn("purchase_order_lines", "description", {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: "Mô tả dòng hàng (tự do)",
    });
    await queryInterface.addColumn("purchase_order_lines", "qty_received", {
      type: Sequelize.DECIMAL(18, 3),
      allowNull: false,
      defaultValue: 0,
      comment: "Số lượng đã nhận từ GRN — tự cập nhật khi có stock move",
    });
    await queryInterface.addColumn("purchase_order_lines", "qty_invoiced", {
      type: Sequelize.DECIMAL(18, 3),
      allowNull: false,
      defaultValue: 0,
      comment: "Số lượng đã lập AP Invoice — tự cập nhật khi có ap_invoice_line.po_line_id",
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn("purchase_order_lines", "qty_invoiced");
    await queryInterface.removeColumn("purchase_order_lines", "qty_received");
    await queryInterface.removeColumn("purchase_order_lines", "description");
    await queryInterface.removeColumn("purchase_order_lines", "discount_amount");
    await queryInterface.renameColumn("purchase_order_lines", "discount_percent", "discount");
  },
};
