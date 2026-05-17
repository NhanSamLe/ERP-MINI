"use strict";
// Add UOM fields to purchase_return_lines for better inventory tracking
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if columns exist before adding
    const table = await queryInterface.describeTable("purchase_return_lines");

    if (!table.uom_id) {
      await queryInterface.addColumn("purchase_return_lines", "uom_id", {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: { model: "uoms", key: "id" },
        onDelete: "SET NULL",
        comment: "UOM của quantity_returned",
      });
    }

    if (!table.qty_in_stock_uom) {
      await queryInterface.addColumn(
        "purchase_return_lines",
        "qty_in_stock_uom",
        {
          type: Sequelize.DECIMAL(18, 3),
          allowNull: false,
          defaultValue: 0,
          comment: "Số lượng đã quy đổi về stock UOM (dùng để trừ tồn kho)",
        },
      );
    }

    if (!table.quantity_confirmed_stock_uom) {
      await queryInterface.addColumn(
        "purchase_return_lines",
        "quantity_confirmed_stock_uom",
        {
          type: Sequelize.DECIMAL(18, 3),
          allowNull: false,
          defaultValue: 0,
          comment: "Số lượng xác nhận quy đổi về stock UOM",
        },
      );
    }

    if (!table.quantity_rejected_stock_uom) {
      await queryInterface.addColumn(
        "purchase_return_lines",
        "quantity_rejected_stock_uom",
        {
          type: Sequelize.DECIMAL(18, 3),
          allowNull: false,
          defaultValue: 0,
          comment: "Số lượng từ chối quy đổi về stock UOM",
        },
      );
    }

    // Add foreign key index for uom_id if it was added
    if (!table.uom_id) {
      await queryInterface.addIndex("purchase_return_lines", ["uom_id"], {
        name: "idx_prl_uom_id",
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable("purchase_return_lines");

    // Remove columns if they exist
    if (table.quantity_rejected_stock_uom) {
      await queryInterface.removeColumn(
        "purchase_return_lines",
        "quantity_rejected_stock_uom",
      );
    }

    if (table.quantity_confirmed_stock_uom) {
      await queryInterface.removeColumn(
        "purchase_return_lines",
        "quantity_confirmed_stock_uom",
      );
    }

    if (table.qty_in_stock_uom) {
      await queryInterface.removeColumn(
        "purchase_return_lines",
        "qty_in_stock_uom",
      );
    }

    if (table.uom_id) {
      // Remove the index first
      const indexes = await queryInterface.showIndex("purchase_return_lines");
      const uomIdIndex = indexes.find((idx) => idx.name === "idx_prl_uom_id");
      if (uomIdIndex) {
        await queryInterface.removeIndex(
          "purchase_return_lines",
          "idx_prl_uom_id",
        );
      }
      await queryInterface.removeColumn("purchase_return_lines", "uom_id");
    }
  },
};
