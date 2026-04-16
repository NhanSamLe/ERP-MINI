"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // === stock_move_lines: thêm lot_id ===
    await queryInterface.addColumn("stock_move_lines", "lot_id", {
      type: Sequelize.BIGINT,
      allowNull: true,
      after: "location_to_id",
      comment: "Lô hàng / Serial Number",
    });

    await queryInterface.addConstraint("stock_move_lines", {
      fields: ["lot_id"],
      type: "foreign key",
      name: "fk_sml_lot",
      references: { table: "stock_lots", field: "id" },
      onDelete: "SET NULL",
    });

    // === stock_balances: thêm lot_id + cập nhật unique key ===
    // MySQL không cho drop unique index khi có FK trỏ vào các cột đó
    // Phải drop FK trước

    // 1. Drop FK constraints tạm thời
    await queryInterface.removeConstraint(
      "stock_balances",
      "fk_stock_balances_warehouse",
    );
    await queryInterface.removeConstraint(
      "stock_balances",
      "fk_stock_balances_product",
    );
    await queryInterface.removeConstraint(
      "stock_balances",
      "fk_stock_balances_location",
    );

    // 2. Drop unique key cũ (warehouse_id, product_id, location_id)
    await queryInterface.removeConstraint(
      "stock_balances",
      "uq_stock_balances_wh_prod_loc",
    );

    // 3. Thêm lot_id
    await queryInterface.addColumn("stock_balances", "lot_id", {
      type: Sequelize.BIGINT,
      allowNull: true,
      after: "location_id",
      comment: "Lô hàng / Serial Number",
    });

    // 4. Tạo lại FK constraints
    await queryInterface.addConstraint("stock_balances", {
      fields: ["warehouse_id"],
      type: "foreign key",
      name: "fk_stock_balances_warehouse",
      references: { table: "warehouses", field: "id" },
      onDelete: "CASCADE",
    });

    await queryInterface.addConstraint("stock_balances", {
      fields: ["product_id"],
      type: "foreign key",
      name: "fk_stock_balances_product",
      references: { table: "products", field: "id" },
      onDelete: "CASCADE",
    });

    await queryInterface.addConstraint("stock_balances", {
      fields: ["location_id"],
      type: "foreign key",
      name: "fk_stock_balances_location",
      references: { table: "stock_locations", field: "id" },
      onDelete: "SET NULL",
    });

    await queryInterface.addConstraint("stock_balances", {
      fields: ["lot_id"],
      type: "foreign key",
      name: "fk_stock_balances_lot",
      references: { table: "stock_lots", field: "id" },
      onDelete: "SET NULL",
    });

    // 5. Unique key mới (warehouse_id, product_id, location_id, lot_id)
    await queryInterface.addConstraint("stock_balances", {
      fields: ["warehouse_id", "product_id", "location_id", "lot_id"],
      type: "unique",
      name: "uq_stock_balances_wh_prod_loc_lot",
    });
  },

  async down(queryInterface) {
    // stock_balances
    await queryInterface.removeConstraint(
      "stock_balances",
      "uq_stock_balances_wh_prod_loc_lot",
    );
    await queryInterface.removeConstraint(
      "stock_balances",
      "fk_stock_balances_lot",
    );
    await queryInterface.removeConstraint(
      "stock_balances",
      "fk_stock_balances_location",
    );
    await queryInterface.removeConstraint(
      "stock_balances",
      "fk_stock_balances_warehouse",
    );
    await queryInterface.removeConstraint(
      "stock_balances",
      "fk_stock_balances_product",
    );

    await queryInterface.removeColumn("stock_balances", "lot_id");

    // Tạo lại FK và unique key trước đó
    await queryInterface.addConstraint("stock_balances", {
      fields: ["warehouse_id"],
      type: "foreign key",
      name: "fk_stock_balances_warehouse",
      references: { table: "warehouses", field: "id" },
      onDelete: "CASCADE",
    });

    await queryInterface.addConstraint("stock_balances", {
      fields: ["product_id"],
      type: "foreign key",
      name: "fk_stock_balances_product",
      references: { table: "products", field: "id" },
      onDelete: "CASCADE",
    });

    await queryInterface.addConstraint("stock_balances", {
      fields: ["location_id"],
      type: "foreign key",
      name: "fk_stock_balances_location",
      references: { table: "stock_locations", field: "id" },
      onDelete: "SET NULL",
    });

    await queryInterface.addConstraint("stock_balances", {
      fields: ["warehouse_id", "product_id", "location_id"],
      type: "unique",
      name: "uq_stock_balances_wh_prod_loc",
    });

    // stock_move_lines
    await queryInterface.removeConstraint("stock_move_lines", "fk_sml_lot");
    await queryInterface.removeColumn("stock_move_lines", "lot_id");
  },
};
