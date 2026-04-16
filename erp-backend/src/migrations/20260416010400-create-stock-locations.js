"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("stock_locations", {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      warehouse_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: { model: "warehouses", key: "id" },
        onDelete: "CASCADE",
        comment: "Kho chứa vị trí này",
      },
      parent_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: { model: "stock_locations", key: "id" },
        onDelete: "SET NULL",
        comment: "Vị trí cha (self-reference, NULL = root)",
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: "Tên vị trí",
      },
      code: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
        comment: "Mã vị trí (unique toàn hệ thống)",
      },
      type: {
        type: Sequelize.ENUM(
          "view",
          "internal",
          "input",
          "output",
          "customer",
          "supplier",
          "transit",
        ),
        allowNull: false,
        defaultValue: "internal",
        comment:
          "Loại vị trí: view=nhóm ảo, internal=lưu trữ thực, input=nhận hàng, output=xuất hàng, customer/supplier=ảo, transit=trung chuyển",
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: "Trạng thái hoạt động",
      },
      path: {
        type: Sequelize.STRING(500),
        allowNull: true,
        comment: "Đường dẫn đầy đủ, ví dụ: /WH/Input/Shelf-A/Row-1",
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

    await queryInterface.addIndex("stock_locations", ["warehouse_id"], {
      name: "idx_stock_locations_warehouse",
    });

    await queryInterface.addIndex("stock_locations", ["parent_id"], {
      name: "idx_stock_locations_parent",
    });

    await queryInterface.addIndex("stock_locations", ["type"], {
      name: "idx_stock_locations_type",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("stock_locations");
  },
};
