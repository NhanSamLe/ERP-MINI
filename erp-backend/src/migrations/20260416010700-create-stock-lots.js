"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("stock_lots", {
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
      lot_no: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: "Số lô hàng",
      },
      serial_no: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: "Số serial (theo dõi từng cái riêng lẻ)",
      },
      manufacture_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        comment: "Ngày sản xuất",
      },
      expiry_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        comment: "Ngày hết hạn",
      },
      supplier_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: { model: "partners", key: "id" },
        onDelete: "SET NULL",
        comment: "Nhà cung cấp lô hàng này",
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: "Ghi chú",
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

    // Unique: mỗi sản phẩm chỉ có 1 lot_no duy nhất
    await queryInterface.addConstraint("stock_lots", {
      fields: ["product_id", "lot_no"],
      type: "unique",
      name: "uq_lot",
    });

    await queryInterface.addIndex("stock_lots", ["product_id"], {
      name: "idx_stock_lots_product",
    });

    await queryInterface.addIndex("stock_lots", ["expiry_date"], {
      name: "idx_stock_lots_expiry",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("stock_lots");
  },
};
