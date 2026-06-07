"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("agent_pending_actions", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      conversation_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      tool_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      tool_args: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM("pending", "confirmed", "cancelled", "executed"),
        allowNull: false,
        defaultValue: "pending",
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.addIndex("agent_pending_actions", [
      "conversation_id",
      "status",
    ]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("agent_pending_actions");
  },
};
