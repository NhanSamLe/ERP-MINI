'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("users", "avatar_url", {
      type: Sequelize.STRING(255),
      allowNull: true, // cho phép null
    });

    await queryInterface.addColumn("users", "avatar_public_id", {
      type: Sequelize.STRING(255),
      allowNull: true, // cho phép null
    });
    await queryInterface.addColumn("products", "image_url", {
      type: Sequelize.STRING(255),
      allowNull: true,
    });

    await queryInterface.addColumn("products", "image_public_id", {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("users", "avatar_url");
    await queryInterface.removeColumn("users", "avatar_public_id");

    await queryInterface.removeColumn("products", "image_url");
    await queryInterface.removeColumn("products", "image_public_id");
  },
};
