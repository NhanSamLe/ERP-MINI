"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // In MySQL, modifying an ENUM is basically changing the column definition
    await queryInterface.changeColumn("ar_receipts", "allocation_status", {
      type: Sequelize.ENUM("unallocated", "partially_allocated", "fully_allocated"),
      allowNull: false,
      defaultValue: "unallocated",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("ar_receipts", "allocation_status", {
      type: Sequelize.ENUM("unallocated", "fully_allocated"),
      allowNull: false,
      defaultValue: "unallocated",
    });
  },
};
