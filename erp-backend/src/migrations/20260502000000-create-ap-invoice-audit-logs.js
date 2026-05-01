"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("ap_invoice_audit_logs", {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      ap_invoice_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: { model: "ap_invoices", key: "id" },
        onDelete: "CASCADE",
      },
      action: {
        // 'created' | 'override_duplicate' | 'mismatch_accepted' | 'auto_created'
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      source: {
        // 'manual' | 'ai_ocr'
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      ocr_confidence: {
        type: Sequelize.DECIMAL(5, 4),
        allowNull: true,
      },
      matching_status: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      matching_details: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      override_reason: {
        type: Sequelize.TEXT,
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
    });

    await queryInterface.addIndex("ap_invoice_audit_logs", ["ap_invoice_id"], {
      name: "idx_audit_logs_ap_invoice_id",
    });

    await queryInterface.addIndex("ap_invoice_audit_logs", ["created_at"], {
      name: "idx_audit_logs_created_at",
    });

    await queryInterface.addIndex("ap_invoice_audit_logs", ["created_by"], {
      name: "idx_audit_logs_created_by",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("ap_invoice_audit_logs");
  },
};
