"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("chat_messages", "tool_calls_json", {
      type: Sequelize.TEXT,
      allowNull: true,
      after: "tool_call_id",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("chat_messages", "tool_calls_json");
  },
};
