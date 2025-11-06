"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("products", "description", {
      type: Sequelize.TEXT,
      allowNull: true,
      after: "image_public_id", // ✅ nếu DB hỗ trợ (MySQL)
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("products", "description");
  },
};
