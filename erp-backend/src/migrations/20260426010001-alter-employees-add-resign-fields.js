"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("employees");

    // status
    await queryInterface.changeColumn("employees", "status", {
      type: Sequelize.ENUM("active", "inactive", "resigned"),
      allowNull: false,
      defaultValue: "active",
    });

    // resign_date
    if (!table.resign_date) {
      await queryInterface.addColumn("employees", "resign_date", {
        type: Sequelize.DATEONLY,
        allowNull: true,
      });
    }

    // resign_reason
    if (!table.resign_reason) {
      await queryInterface.addColumn("employees", "resign_reason", {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("employees");

    if (table.resign_reason) {
      await queryInterface.removeColumn("employees", "resign_reason");
    }

    if (table.resign_date) {
      await queryInterface.removeColumn("employees", "resign_date");
    }

    await queryInterface.changeColumn("employees", "status", {
      type: Sequelize.ENUM("active", "inactive"),
      allowNull: false,
      defaultValue: "active",
    });
  },
};
