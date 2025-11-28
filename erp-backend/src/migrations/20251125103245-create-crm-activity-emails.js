"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("crm_activity_emails", {
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

      direction: {
        type: Sequelize.ENUM("in", "out"),
      },

      email_from: Sequelize.STRING(255),
      email_to: Sequelize.STRING(255),

      status: Sequelize.STRING(50),
      message_id: Sequelize.STRING(255),
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("crm_activity_emails");
  },
};
