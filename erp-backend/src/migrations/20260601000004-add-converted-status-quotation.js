"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("quotations", "status", {
      type: Sequelize.ENUM(
        "draft", "sent", "accepted", "rejected", "expired", "cancelled", "converted"
      ),
      defaultValue: "draft",
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("quotations", "status", {
      type: Sequelize.ENUM(
        "draft", "sent", "accepted", "rejected", "expired", "cancelled"
      ),
      defaultValue: "draft",
    });
  },
};
