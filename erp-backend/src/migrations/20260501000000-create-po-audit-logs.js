"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("po_audit_logs", {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      po_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: "purchase_orders",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      action: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: "CREATE, UPDATE, APPROVE, CANCEL",
      },
      old_values: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      new_values: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      changed_by: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "RESTRICT",
      },
      changed_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      branch_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: "branches",
          key: "id",
        },
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

    // Create indexes for performance
    await queryInterface.addIndex("po_audit_logs", ["po_id"], {
      name: "idx_po_audit_logs_po_id",
    });

    await queryInterface.addIndex("po_audit_logs", ["changed_by"], {
      name: "idx_po_audit_logs_changed_by",
    });

    await queryInterface.addIndex("po_audit_logs", ["changed_at"], {
      name: "idx_po_audit_logs_changed_at",
    });

    await queryInterface.addIndex("po_audit_logs", ["branch_id"], {
      name: "idx_po_audit_logs_branch_id",
    });

    await queryInterface.addIndex("po_audit_logs", ["action"], {
      name: "idx_po_audit_logs_action",
    });

    // Composite index for common queries
    await queryInterface.addIndex("po_audit_logs", ["po_id", "changed_at"], {
      name: "idx_po_audit_logs_po_id_changed_at",
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("po_audit_logs");
  },
};
