"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    /* ===============================
     * 1. ar_receipts - allocation_status
     * =============================== */
    await queryInterface.addColumn("ar_receipts", "allocation_status", {
      type: Sequelize.ENUM(
        "unallocated",
        "fully_allocated"
      ),
      allowNull: false,
      defaultValue: "unallocated",
    });

    await queryInterface.changeColumn("ar_invoices", "status", {
      type: Sequelize.ENUM(
        "draft",
        "posted",
        "partially_paid",
        "paid",
        "cancelled"
      ),
      allowNull: false,
      defaultValue: "draft",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("ar_invoices", "status", {
      type: Sequelize.ENUM(
        "draft",
        "posted",
        "paid",
        "cancelled"
      ),
      allowNull: false,
      defaultValue: "draft",
    });
    await queryInterface.removeColumn("ar_receipts", "allocation_status");
  },
};
