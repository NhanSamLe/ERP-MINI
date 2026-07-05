"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // Drop the incorrect foreign key constraint that references price_lists
      await queryInterface.sequelize.query(
        "ALTER TABLE purchase_orders DROP FOREIGN KEY purchase_orders_price_list_id_foreign_idx"
      );
      console.log("Successfully dropped incorrect foreign key constraint purchase_orders_price_list_id_foreign_idx");
    } catch (e) {
      console.warn("Could not drop foreign key purchase_orders_price_list_id_foreign_idx: ", e.message);
    }
  },

  async down(queryInterface) {
    // No-op: this was an incorrect constraint pointing to the wrong table
  }
};
