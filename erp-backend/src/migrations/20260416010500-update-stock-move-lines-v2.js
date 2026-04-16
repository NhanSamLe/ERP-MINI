"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Xóa cột uom STRING cũ
    await queryInterface.removeColumn("stock_move_lines", "uom");

    // 2. Thêm uom_id → FK uoms.id
    await queryInterface.addColumn("stock_move_lines", "uom_id", {
      type: Sequelize.BIGINT,
      allowNull: true,
      after: "quantity",
      references: { model: "uoms", key: "id" },
      onDelete: "SET NULL",
      comment: "Đơn vị tính",
    });

    // 3. Thêm location_from_id
    await queryInterface.addColumn("stock_move_lines", "location_from_id", {
      type: Sequelize.BIGINT,
      allowNull: true,
      after: "uom_id",
      references: { model: "stock_locations", key: "id" },
      onDelete: "SET NULL",
      comment: "Vị trí xuất hàng",
    });

    // 4. Thêm location_to_id
    await queryInterface.addColumn("stock_move_lines", "location_to_id", {
      type: Sequelize.BIGINT,
      allowNull: true,
      after: "location_from_id",
      references: { model: "stock_locations", key: "id" },
      onDelete: "SET NULL",
      comment: "Vị trí nhận hàng",
    });

    // 5. FK constraints
    await queryInterface.addConstraint("stock_move_lines", {
      fields: ["uom_id"],
      type: "foreign key",
      name: "fk_sml_uom",
      references: { table: "uoms", field: "id" },
      onDelete: "SET NULL",
    });

    await queryInterface.addConstraint("stock_move_lines", {
      fields: ["location_from_id"],
      type: "foreign key",
      name: "fk_sml_location_from",
      references: { table: "stock_locations", field: "id" },
      onDelete: "SET NULL",
    });

    await queryInterface.addConstraint("stock_move_lines", {
      fields: ["location_to_id"],
      type: "foreign key",
      name: "fk_sml_location_to",
      references: { table: "stock_locations", field: "id" },
      onDelete: "SET NULL",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint(
      "stock_move_lines",
      "fk_sml_location_to",
    );
    await queryInterface.removeConstraint(
      "stock_move_lines",
      "fk_sml_location_from",
    );
    await queryInterface.removeConstraint("stock_move_lines", "fk_sml_uom");

    await queryInterface.removeColumn("stock_move_lines", "location_to_id");
    await queryInterface.removeColumn("stock_move_lines", "location_from_id");
    await queryInterface.removeColumn("stock_move_lines", "uom_id");

    // Khôi phục uom STRING
    await queryInterface.addColumn("stock_move_lines", "uom", {
      type: Sequelize.STRING(50),
      allowNull: true,
    });
  },
};
