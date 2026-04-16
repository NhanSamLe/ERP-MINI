"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Xóa cột uom (STRING) cũ
    await queryInterface.removeColumn("products", "uom");

    // 2. Thêm uom_id → FK uoms.id
    await queryInterface.addColumn("products", "uom_id", {
      type: Sequelize.BIGINT,
      allowNull: true,
      after: "barcode",
      references: { model: "uoms", key: "id" },
      onDelete: "SET NULL",
      comment: "Đơn vị tính bán hàng / xuất kho",
    });

    // 3. Thêm purchase_uom_id → FK uoms.id
    await queryInterface.addColumn("products", "purchase_uom_id", {
      type: Sequelize.BIGINT,
      allowNull: true,
      after: "uom_id",
      references: { model: "uoms", key: "id" },
      onDelete: "SET NULL",
      comment: "Đơn vị tính mua hàng (mặc định dùng uom_id nếu NULL)",
    });

    // 4. Thêm product_type
    await queryInterface.addColumn("products", "product_type", {
      type: Sequelize.ENUM("storable", "consumable", "service"),
      allowNull: false,
      defaultValue: "storable",
      after: "purchase_uom_id",
      comment:
        "Loại sản phẩm: storable=có tồn kho, consumable=tiêu hao, service=dịch vụ",
    });

    // 5. Thêm min_stock_qty
    await queryInterface.addColumn("products", "min_stock_qty", {
      type: Sequelize.DECIMAL(18, 3),
      allowNull: true,
      defaultValue: 0,
      after: "product_type",
      comment: "Tồn kho tối thiểu — cảnh báo khi tồn kho xuống dưới ngưỡng",
    });

    // 6. Thêm internal_ref
    await queryInterface.addColumn("products", "internal_ref", {
      type: Sequelize.STRING(100),
      allowNull: true,
      after: "min_stock_qty",
      comment: "Mã tham chiếu nội bộ",
    });

    // 7. Thêm weight
    await queryInterface.addColumn("products", "weight", {
      type: Sequelize.DECIMAL(10, 3),
      allowNull: true,
      after: "internal_ref",
      comment: "Trọng lượng (kg)",
    });

    // 8. Thêm volume
    await queryInterface.addColumn("products", "volume", {
      type: Sequelize.DECIMAL(10, 3),
      allowNull: true,
      after: "weight",
      comment: "Thể tích (lít hoặc m³)",
    });

    // 9. Thêm warranty_months
    await queryInterface.addColumn("products", "warranty_months", {
      type: Sequelize.INTEGER,
      allowNull: true,
      after: "volume",
      comment: "Thời gian bảo hành (tháng)",
    });

    // 10. Thêm notes
    await queryInterface.addColumn("products", "notes", {
      type: Sequelize.TEXT,
      allowNull: true,
      after: "warranty_months",
      comment: "Ghi chú tự do",
    });

    // 11. Thêm FK constraints
    await queryInterface.addConstraint("products", {
      fields: ["uom_id"],
      type: "foreign key",
      name: "fk_products_uom",
      references: { table: "uoms", field: "id" },
      onDelete: "SET NULL",
    });

    await queryInterface.addConstraint("products", {
      fields: ["purchase_uom_id"],
      type: "foreign key",
      name: "fk_products_purchase_uom",
      references: { table: "uoms", field: "id" },
      onDelete: "SET NULL",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint("products", "fk_products_uom");
    await queryInterface.removeConstraint(
      "products",
      "fk_products_purchase_uom",
    );

    await queryInterface.removeColumn("products", "notes");
    await queryInterface.removeColumn("products", "warranty_months");
    await queryInterface.removeColumn("products", "volume");
    await queryInterface.removeColumn("products", "weight");
    await queryInterface.removeColumn("products", "internal_ref");
    await queryInterface.removeColumn("products", "min_stock_qty");
    await queryInterface.removeColumn("products", "product_type");
    await queryInterface.removeColumn("products", "purchase_uom_id");
    await queryInterface.removeColumn("products", "uom_id");

    // Khôi phục cột uom STRING
    await queryInterface.addColumn("products", "uom", {
      type: Sequelize.STRING(50),
      allowNull: true,
    });
  },
};
