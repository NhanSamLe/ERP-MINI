"use strict";
// Tạo bảng purchase_price_lists và purchase_price_list_items riêng biệt
// Lý do: price_lists hiện tại thuộc Sales module, dùng sale_price của product.
// Purchase price list cần: cost_price của NCC, supplier_id per item, lead_time_days.
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. purchase_price_lists
    await queryInterface.createTable("purchase_price_lists", {
      id:          { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      name:        { type: Sequelize.STRING(100), allowNull: false },
      code:        { type: Sequelize.STRING(20), allowNull: true, unique: true },
      currency_id: { type: Sequelize.BIGINT, allowNull: true, references: { model: "currencies", key: "id" }, onDelete: "SET NULL" },
      supplier_id: { type: Sequelize.BIGINT, allowNull: true, references: { model: "partners", key: "id" }, onDelete: "SET NULL",
                     comment: "NULL = áp dụng cho mọi NCC; có giá trị = chỉ áp dụng cho NCC này" },
      is_active:   { type: Sequelize.TINYINT(1), allowNull: false, defaultValue: 1 },
      start_date:  { type: Sequelize.DATEONLY, allowNull: true },
      end_date:    { type: Sequelize.DATEONLY, allowNull: true },
      notes:       { type: Sequelize.TEXT, allowNull: true },
      created_by:  { type: Sequelize.BIGINT, allowNull: false, references: { model: "users", key: "id" }, onDelete: "RESTRICT" },
      created_at:  { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updated_at:  { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP") },
    });

    await queryInterface.addIndex("purchase_price_lists", ["supplier_id"],  { name: "idx_ppl_supplier_id" });
    await queryInterface.addIndex("purchase_price_lists", ["is_active"],    { name: "idx_ppl_is_active" });
    await queryInterface.addIndex("purchase_price_lists", ["start_date", "end_date"], { name: "idx_ppl_date_range" });

    // 2. purchase_price_list_items
    await queryInterface.createTable("purchase_price_list_items", {
      id:               { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      price_list_id:    { type: Sequelize.BIGINT, allowNull: false, references: { model: "purchase_price_lists", key: "id" }, onDelete: "CASCADE" },
      product_id:       { type: Sequelize.BIGINT, allowNull: false, references: { model: "products", key: "id" }, onDelete: "RESTRICT" },
      supplier_id:      { type: Sequelize.BIGINT, allowNull: true,  references: { model: "partners", key: "id" }, onDelete: "SET NULL",
                          comment: "Override NCC cụ thể cho dòng này (nếu price list là chung)" },
      min_quantity:     { type: Sequelize.DECIMAL(18, 3), allowNull: false, defaultValue: 1,
                          comment: "Số lượng tối thiểu để áp dụng giá này (price break)" },
      unit_price:       { type: Sequelize.DECIMAL(18, 2), allowNull: false },
      discount_percent: { type: Sequelize.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
      uom_id:           { type: Sequelize.BIGINT, allowNull: true, references: { model: "uoms", key: "id" }, onDelete: "SET NULL" },
      lead_time_days:   { type: Sequelize.INTEGER, allowNull: true, comment: "Thời gian giao hàng cam kết (ngày)" },
      start_date:       { type: Sequelize.DATEONLY, allowNull: true },
      end_date:         { type: Sequelize.DATEONLY, allowNull: true },
      created_at:       { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updated_at:       { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP") },
    });

    await queryInterface.addIndex("purchase_price_list_items", ["price_list_id"],           { name: "idx_ppli_price_list_id" });
    await queryInterface.addIndex("purchase_price_list_items", ["product_id"],              { name: "idx_ppli_product_id" });
    await queryInterface.addIndex("purchase_price_list_items", ["supplier_id"],             { name: "idx_ppli_supplier_id" });
    await queryInterface.addIndex("purchase_price_list_items", ["price_list_id", "product_id", "min_quantity"],
      { name: "idx_ppli_lookup" });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("purchase_price_list_items");
    await queryInterface.dropTable("purchase_price_lists");
  },
};
