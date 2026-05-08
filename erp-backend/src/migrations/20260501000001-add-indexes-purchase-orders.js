"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add indexes for search performance
    await queryInterface.addIndex("purchase_orders", ["po_no"], {
      name: "idx_purchase_orders_po_no",
    });

    await queryInterface.addIndex("purchase_orders", ["supplier_id"], {
      name: "idx_purchase_orders_supplier_id",
    });

    await queryInterface.addIndex("purchase_orders", ["status"], {
      name: "idx_purchase_orders_status",
    });

    await queryInterface.addIndex("purchase_orders", ["order_date"], {
      name: "idx_purchase_orders_order_date",
    });

    await queryInterface.addIndex("purchase_orders", ["total_after_tax"], {
      name: "idx_purchase_orders_total_after_tax",
    });

    await queryInterface.addIndex("purchase_orders", ["branch_id"], {
      name: "idx_purchase_orders_branch_id",
    });

    // Composite indexes for common queries
    await queryInterface.addIndex("purchase_orders", ["branch_id", "status"], {
      name: "idx_purchase_orders_branch_id_status",
    });

    await queryInterface.addIndex(
      "purchase_orders",
      ["branch_id", "order_date"],
      {
        name: "idx_purchase_orders_branch_id_order_date",
      },
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex(
      "purchase_orders",
      "idx_purchase_orders_po_no",
    );
    await queryInterface.removeIndex(
      "purchase_orders",
      "idx_purchase_orders_supplier_id",
    );
    await queryInterface.removeIndex(
      "purchase_orders",
      "idx_purchase_orders_status",
    );
    await queryInterface.removeIndex(
      "purchase_orders",
      "idx_purchase_orders_order_date",
    );
    await queryInterface.removeIndex(
      "purchase_orders",
      "idx_purchase_orders_total_after_tax",
    );
    await queryInterface.removeIndex(
      "purchase_orders",
      "idx_purchase_orders_branch_id",
    );
    await queryInterface.removeIndex(
      "purchase_orders",
      "idx_purchase_orders_branch_id_status",
    );
    await queryInterface.removeIndex(
      "purchase_orders",
      "idx_purchase_orders_branch_id_order_date",
    );
  },
};
