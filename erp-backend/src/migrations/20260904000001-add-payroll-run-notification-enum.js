'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("notifications", "reference_type", {
      type: Sequelize.ENUM(
        "SALE_ORDER",
        "AR_INVOICE",
        "AR_RECEIPT",
        "PURCHASE_ORDER",
        "AP_INVOICE",
        "AP_PAYMENT",
        "LEAD",
        "PAYROLL_RUN"
      ),
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("notifications", "reference_type", {
      type: Sequelize.ENUM(
        "SALE_ORDER",
        "AR_INVOICE",
        "AR_RECEIPT",
        "PURCHASE_ORDER",
        "AP_INVOICE",
        "AP_PAYMENT",
        "LEAD"
      ),
      allowNull: false,
    });
  }
};
