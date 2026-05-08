"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("ap_invoice_lines", "po_line_id", {
      type: Sequelize.BIGINT,
      allowNull: true,
    });

    await queryInterface.addColumn("ap_invoice_lines", "grn_line_id", {
      type: Sequelize.BIGINT,
      allowNull: true,
    });

    await queryInterface.addColumn("ap_invoice_lines", "matching_result", {
      type: Sequelize.ENUM("matched", "price_mismatch", "qty_mismatch"),
      allowNull: true,
    });

    await queryInterface.addConstraint("ap_invoice_lines", {
      fields: ["po_line_id"],
      type: "foreign key",
      name: "fk_ap_invoice_lines_po_line",
      references: { table: "purchase_order_lines", field: "id" },
      onDelete: "SET NULL",
    });

    await queryInterface.addConstraint("ap_invoice_lines", {
      fields: ["grn_line_id"],
      type: "foreign key",
      name: "fk_ap_invoice_lines_grn_line",
      references: { table: "stock_move_lines", field: "id" },
      onDelete: "SET NULL",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeConstraint(
      "ap_invoice_lines",
      "fk_ap_invoice_lines_grn_line",
    );
    await queryInterface.removeConstraint(
      "ap_invoice_lines",
      "fk_ap_invoice_lines_po_line",
    );

    await queryInterface.removeColumn("ap_invoice_lines", "matching_result");
    await queryInterface.removeColumn("ap_invoice_lines", "grn_line_id");
    await queryInterface.removeColumn("ap_invoice_lines", "po_line_id");
  },
};
