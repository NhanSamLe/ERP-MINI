"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("crm_activity_meetings", {
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

      start_at: Sequelize.DATE,
      end_at: Sequelize.DATE,

      location: Sequelize.STRING(255),

      attendees: Sequelize.TEXT, // JSON string

      meeting_link: Sequelize.STRING(255),
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("crm_activity_meetings");
  },
};
