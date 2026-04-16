"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("physical_inventories", {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      inv_no: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
        comment: "Số phiếu kiểm kê (unique)",
      },
      warehouse_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: { model: "warehouses", key: "id" },
        onDelete: "RESTRICT",
        comment: "Kho kiểm kê",
      },
      branch_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: { model: "branches", key: "id" },
        onDelete: "RESTRICT",
        comment: "Chi nhánh",
      },
      inv_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        comment: "Ngày kiểm kê",
      },
      status: {
        type: Sequelize.ENUM("draft", "in_progress", "validated", "cancelled"),
        allowNull: false,
        defaultValue: "draft",
        comment: "Trạng thái: draft→in_progress→validated | cancelled",
      },
      created_by: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "RESTRICT",
        comment: "Người tạo phiếu",
      },
      validated_by: {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: { model: "users", key: "id" },
        onDelete: "SET NULL",
        comment: "Người xác nhận kiểm kê",
      },
      validated_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: "Thời điểm xác nhận",
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

    await queryInterface.addIndex("physical_inventories", ["warehouse_id"], {
      name: "idx_pi_warehouse",
    });

    await queryInterface.addIndex("physical_inventories", ["branch_id"], {
      name: "idx_pi_branch",
    });

    await queryInterface.addIndex("physical_inventories", ["status"], {
      name: "idx_pi_status",
    });

    await queryInterface.addIndex("physical_inventories", ["inv_date"], {
      name: "idx_pi_date",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("physical_inventories");
  },
};
