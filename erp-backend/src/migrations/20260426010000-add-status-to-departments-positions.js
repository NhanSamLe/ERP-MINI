"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("departments", "status", {
      type: Sequelize.ENUM("active", "inactive"),
      allowNull: false,
      defaultValue: "active",
    });

    await queryInterface.addColumn("positions", "status", {
      type: Sequelize.ENUM("active", "inactive"),
      allowNull: false,
      defaultValue: "active",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("departments", "status");
    await queryInterface.removeColumn("positions", "status");
  },
};
