"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("product_supplier_info", {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      product_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: { model: "products", key: "id" },
        onDelete: "CASCADE",
        comment: "Sản phẩm",
      },
      supplier_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: { model: "partners", key: "id" },
        onDelete: "CASCADE",
        comment: "Nhà cung cấp",
      },
      supplier_product_code: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: "Mã sản phẩm theo nhà cung cấp",
      },
      supplier_product_name: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: "Tên sản phẩm theo nhà cung cấp",
      },
      min_order_qty: {
        type: Sequelize.DECIMAL(18, 3),
        allowNull: true,
        comment: "Số lượng đặt hàng tối thiểu",
      },
      lead_time_days: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: "Thời gian giao hàng (ngày)",
      },
      price: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: true,
        comment: "Giá mua từ nhà cung cấp",
      },
      currency_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: { model: "currencies", key: "id" },
        onDelete: "SET NULL",
        comment: "Đơn vị tiền tệ",
      },
      is_preferred: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "Nhà cung cấp ưu tiên",
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

    // Unique: mỗi cặp (product, supplier) chỉ có 1 record
    await queryInterface.addConstraint("product_supplier_info", {
      fields: ["product_id", "supplier_id"],
      type: "unique",
      name: "uq_product_supplier",
    });

    await queryInterface.addIndex("product_supplier_info", ["product_id"], {
      name: "idx_psi_product",
    });

    await queryInterface.addIndex("product_supplier_info", ["supplier_id"], {
      name: "idx_psi_supplier",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("product_supplier_info");
  },
};
