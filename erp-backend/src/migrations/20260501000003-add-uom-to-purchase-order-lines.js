"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // uom_id: đơn vị mua (purchase UOM), FK → uoms
    await queryInterface.addColumn("purchase_order_lines", "uom_id", {
      type: Sequelize.BIGINT,
      allowNull: true,
      after: "quantity",
      references: { model: "uoms", key: "id" },
      onDelete: "SET NULL",
    });

    // qty_in_stock_uom: số lượng đã quy đổi về stock UOM của product
    // Ví dụ: mua 1 BOX (1 box = 10 PCS) → qty_in_stock_uom = 10
    await queryInterface.addColumn("purchase_order_lines", "qty_in_stock_uom", {
      type: Sequelize.DECIMAL(18, 3),
      allowNull: true,
      after: "uom_id",
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn(
      "purchase_order_lines",
      "qty_in_stock_uom",
    );
    await queryInterface.removeColumn("purchase_order_lines", "uom_id");
  },
};
