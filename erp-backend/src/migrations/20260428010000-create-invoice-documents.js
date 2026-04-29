"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("invoice_documents", {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      branch_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: { model: "branches", key: "id" },
        onDelete: "CASCADE",
      },
      purchase_invoice_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: { model: "ap_invoices", key: "id" },
        onDelete: "SET NULL",
      },
      original_filename: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      file_path: {
        type: Sequelize.STRING(500),
        allowNull: false,
      },
      file_type: {
        type: Sequelize.ENUM("pdf", "jpg", "png"),
        allowNull: false,
      },
      ocr_status: {
        type: Sequelize.ENUM("pending", "processing", "done", "failed"),
        allowNull: false,
        defaultValue: "pending",
      },
      ocr_engine: {
        type: Sequelize.ENUM("openai_vision", "google_doc_ai"),
        allowNull: true,
        defaultValue: "openai_vision",
      },
      ocr_raw_text: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      ocr_result: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      ocr_confidence: {
        type: Sequelize.DECIMAL(5, 4),
        allowNull: true,
      },
      processing_time_ms: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      created_by: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "RESTRICT",
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.addIndex(
      "invoice_documents",
      ["branch_id", "ocr_status"],
      { name: "idx_invoice_docs_branch_status" },
    );

    await queryInterface.addIndex("invoice_documents", ["created_at"], {
      name: "idx_invoice_docs_created_at",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("invoice_documents");
  },
};
