"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // ADD TO ar_invoices
    await queryInterface.addColumn("ar_invoices", "branch_id", {
      type: Sequelize.BIGINT,
      allowNull: false,
      defaultValue: 1, // tạm, lát cập nhật lại nếu cần
    });

    // ADD TO ar_receipts
    await queryInterface.addColumn("ar_receipts", "branch_id", {
      type: Sequelize.BIGINT,
      allowNull: false,
      defaultValue: 1,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("ar_invoices", "branch_id");
    await queryInterface.removeColumn("ar_receipts", "branch_id");
  },
};
