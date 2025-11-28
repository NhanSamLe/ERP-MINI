"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("crm_activity_calls", {
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

      duration: Sequelize.INTEGER,

      call_from: Sequelize.STRING(100),
      call_to: Sequelize.STRING(100),

      result: Sequelize.STRING(50),

      recording_url: Sequelize.STRING(255),
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("crm_activity_calls");
  },
};
