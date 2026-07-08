'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Modify ENUM to include 'stock_move'
    await queryInterface.changeColumn('document_signatures', 'document_type', {
      type: Sequelize.ENUM('purchase_order', 'ap_invoice', 'ap_payment', 'stock_move'),
      allowNull: false
    });
  },

  async down(queryInterface, Sequelize) {
    // Revert back
    await queryInterface.changeColumn('document_signatures', 'document_type', {
      type: Sequelize.ENUM('purchase_order', 'ap_invoice', 'ap_payment'),
      allowNull: false
    });
  }
};
