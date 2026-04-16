"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // MySQL không cho drop unique index khi các cột đó có FK constraint
    // Phải drop FK trước, drop unique, tạo unique mới, rồi tạo lại FK

    // 1. Drop FK constraints tạm thời
    await queryInterface.removeConstraint(
      "stock_balances",
      "fk_stock_balances_warehouse",
    );
    await queryInterface.removeConstraint(
      "stock_balances",
      "fk_stock_balances_product",
    );

    // 2. Drop unique key cũ (warehouse_id, product_id)
    await queryInterface.removeConstraint(
      "stock_balances",
      "uq_stock_balances_warehouse_product",
    );

    // 3. Thêm location_id
    await queryInterface.addColumn("stock_balances", "location_id", {
      type: Sequelize.BIGINT,
      allowNull: true,
      after: "product_id",
      comment: "Vị trí lưu trữ trong kho",
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

    // 5. FK cho location_id
    await queryInterface.addConstraint("stock_balances", {
      fields: ["location_id"],
      type: "foreign key",
      name: "fk_stock_balances_location",
      references: { table: "stock_locations", field: "id" },
      onDelete: "SET NULL",
    });

    // 6. Unique key mới (warehouse_id, product_id, location_id)
    await queryInterface.addConstraint("stock_balances", {
      fields: ["warehouse_id", "product_id", "location_id"],
      type: "unique",
      name: "uq_stock_balances_wh_prod_loc",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeConstraint(
      "stock_balances",
      "uq_stock_balances_wh_prod_loc",
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

    await queryInterface.removeColumn("stock_balances", "location_id");

    // Tạo lại FK
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

    // Khôi phục unique key cũ
    await queryInterface.addConstraint("stock_balances", {
      fields: ["warehouse_id", "product_id"],
      type: "unique",
      name: "uq_stock_balances_warehouse_product",
    });
  },
};
