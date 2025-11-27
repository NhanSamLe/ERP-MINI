"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("crm_timeline_events", {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },

      related_type: {
        type: Sequelize.ENUM("lead", "opportunity", "customer"),
        allowNull: false,
      },

      related_id: { type: Sequelize.BIGINT, allowNull: false },

      event_type: { type: Sequelize.STRING(50), allowNull: false },
      title: { type: Sequelize.STRING(255), allowNull: false },
      description: { type: Sequelize.TEXT },

      created_by: { type: Sequelize.BIGINT },

      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("crm_timeline_events");
  },
};
