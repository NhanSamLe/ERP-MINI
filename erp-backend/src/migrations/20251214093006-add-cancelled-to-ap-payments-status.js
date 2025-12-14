"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("ap_payments", "status", {
      type: Sequelize.ENUM("draft", "posted", "cancelled"),
      allowNull: false,
      defaultValue: "draft",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("ap_payments", "status", {
      type: Sequelize.ENUM("draft", "posted"),
      allowNull: false,
      defaultValue: "draft",
    });
  },
};
