"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("invoice_anomaly_results", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      document_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: { model: "invoice_documents", key: "id" },
        onDelete: "CASCADE",
      },
      risk_score: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      risk_level: {
        type: Sequelize.ENUM("low_risk", "medium_risk", "high_risk"),
        allowNull: false,
      },
      flags: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: [],
      },
      math_consistent: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      skipped_reasons: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: [],
      },
      analysis_duration_ms: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      analyzed_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      override_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      override_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    });

    // Index on document_id for fast lookup by document
    await queryInterface.addIndex("invoice_anomaly_results", ["document_id"], {
      name: "idx_invoice_anomaly_results_document_id",
    });

    // Index on risk_score DESC for sorting by risk
    await queryInterface.addIndex(
      "invoice_anomaly_results",
      [{ name: "risk_score", order: "DESC" }],
      { name: "idx_invoice_anomaly_results_risk_score_desc" },
    );
  },

  async down(queryInterface) {
    await queryInterface.removeIndex(
      "invoice_anomaly_results",
      "idx_invoice_anomaly_results_risk_score_desc",
    );
    await queryInterface.removeIndex(
      "invoice_anomaly_results",
      "idx_invoice_anomaly_results_document_id",
    );
    await queryInterface.dropTable("invoice_anomaly_results");
  },
};
