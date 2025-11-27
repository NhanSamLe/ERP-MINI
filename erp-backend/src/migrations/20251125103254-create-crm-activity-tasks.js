"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("crm_activity_tasks", {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },

      activity_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: "crm_activities",
          key: "id",
        },
        onDelete: "CASCADE",
      },

      priority: {
        type: Sequelize.ENUM("low", "medium", "high"),
      },

      status: {
        type: Sequelize.ENUM(
          "Not Started",
          "In Progress",
          "Completed"
        ),
        defaultValue: "Not Started",
      },

      reminder_at: Sequelize.DATE,
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("crm_activity_tasks");
  },
};
