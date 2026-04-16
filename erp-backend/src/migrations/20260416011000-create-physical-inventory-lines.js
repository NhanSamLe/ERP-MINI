"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("physical_inventory_lines", {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      inventory_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: { model: "physical_inventories", key: "id" },
        onDelete: "CASCADE",
        comment: "Phiếu kiểm kê",
      },
      product_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: { model: "products", key: "id" },
        onDelete: "RESTRICT",
        comment: "Sản phẩm",
      },
      location_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: { model: "stock_locations", key: "id" },
        onDelete: "SET NULL",
        comment: "Vị trí lưu trữ",
      },
      lot_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: { model: "stock_lots", key: "id" },
        onDelete: "SET NULL",
        comment: "Lô hàng / Serial Number",
      },
      theoretical_qty: {
        type: Sequelize.DECIMAL(18, 3),
        allowNull: false,
        defaultValue: 0,
        comment:
          "Tồn kho lý thuyết (lấy từ stock_balances tại thời điểm tạo phiếu)",
      },
      counted_qty: {
        type: Sequelize.DECIMAL(18, 3),
        allowNull: false,
        defaultValue: 0,
        comment: "Số lượng đếm thực tế",
      },
      difference_qty: {
        type: Sequelize.DECIMAL(18, 3),
        allowNull: false,
        defaultValue: 0,
        comment:
          "Chênh lệch = counted_qty - theoretical_qty (tính bởi service)",
      },
      unit_cost: {
        type: Sequelize.DECIMAL(18, 4),
        allowNull: true,
        comment: "Giá vốn tại thời điểm kiểm kê",
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal(
          "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
        ),
      },
    });

    await queryInterface.addIndex(
      "physical_inventory_lines",
      ["inventory_id"],
      {
        name: "idx_pil_inventory",
      },
    );

    await queryInterface.addIndex("physical_inventory_lines", ["product_id"], {
      name: "idx_pil_product",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("physical_inventory_lines");
  },
};
