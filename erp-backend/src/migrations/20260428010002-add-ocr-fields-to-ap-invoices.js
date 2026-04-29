"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // supplier_id
    await queryInterface.addColumn("ap_invoices", "supplier_id", {
      type: Sequelize.BIGINT,
      allowNull: true,
    });

    // invoice_series
    await queryInterface.addColumn("ap_invoices", "invoice_series", {
      type: Sequelize.STRING(20),
      allowNull: true,
    });

    // invoice_template
    await queryInterface.addColumn("ap_invoices", "invoice_template", {
      type: Sequelize.STRING(20),
      allowNull: true,
    });

    // tax_code
    await queryInterface.addColumn("ap_invoices", "tax_code", {
      type: Sequelize.STRING(20),
      allowNull: true,
    });

    // source
    await queryInterface.addColumn("ap_invoices", "source", {
      type: Sequelize.ENUM("manual", "ai_ocr"),
      allowNull: false,
      defaultValue: "manual",
    });

    // invoice_document_id
    await queryInterface.addColumn("ap_invoices", "invoice_document_id", {
      type: Sequelize.BIGINT,
      allowNull: true,
    });

    // ocr_confidence
    await queryInterface.addColumn("ap_invoices", "ocr_confidence", {
      type: Sequelize.DECIMAL(5, 4),
      allowNull: true,
    });

    // matching_status
    await queryInterface.addColumn("ap_invoices", "matching_status", {
      type: Sequelize.ENUM("pending", "matched", "mismatch"),
      allowNull: false,
      defaultValue: "pending",
    });

    // matching_details
    await queryInterface.addColumn("ap_invoices", "matching_details", {
      type: Sequelize.JSON,
      allowNull: true,
    });

    // FK: supplier_id → partners(id)
    await queryInterface.addConstraint("ap_invoices", {
      fields: ["supplier_id"],
      type: "foreign key",
      name: "fk_ap_invoices_supplier",
      references: { table: "partners", field: "id" },
      onDelete: "SET NULL",
    });

    // FK: invoice_document_id → invoice_documents(id)
    await queryInterface.addConstraint("ap_invoices", {
      fields: ["invoice_document_id"],
      type: "foreign key",
      name: "fk_ap_invoices_invoice_document",
      references: { table: "invoice_documents", field: "id" },
      onDelete: "SET NULL",
    });

    // Index on (invoice_no, supplier_id, branch_id)
    await queryInterface.addIndex(
      "ap_invoices",
      ["invoice_no", "supplier_id", "branch_id"],
      { name: "idx_ap_invoices_invoice_no_supplier_branch" },
    );
  },

  async down(queryInterface, Sequelize) {
    // Remove index
    await queryInterface.removeIndex(
      "ap_invoices",
      "idx_ap_invoices_invoice_no_supplier_branch",
    );

    // Remove FK constraints
    await queryInterface.removeConstraint(
      "ap_invoices",
      "fk_ap_invoices_invoice_document",
    );
    await queryInterface.removeConstraint(
      "ap_invoices",
      "fk_ap_invoices_supplier",
    );

    // Remove columns
    await queryInterface.removeColumn("ap_invoices", "matching_details");
    await queryInterface.removeColumn("ap_invoices", "matching_status");
    await queryInterface.removeColumn("ap_invoices", "ocr_confidence");
    await queryInterface.removeColumn("ap_invoices", "invoice_document_id");
    await queryInterface.removeColumn("ap_invoices", "source");
    await queryInterface.removeColumn("ap_invoices", "tax_code");
    await queryInterface.removeColumn("ap_invoices", "invoice_template");
    await queryInterface.removeColumn("ap_invoices", "invoice_series");
    await queryInterface.removeColumn("ap_invoices", "supplier_id");
  },
};
