"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("chat_messages", {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      conversation_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: { model: "chat_conversations", key: "id" },
        onDelete: "CASCADE",
      },
      role: {
        type: Sequelize.ENUM("user", "assistant", "tool"),
        allowNull: false,
        comment: "Vai trò: user | assistant | tool",
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: "Nội dung tin nhắn",
      },
      tool_name: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: "Tên tool được gọi (chỉ khi role = tool)",
      },
      tool_call_id: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: "ID tool call từ LLM (dùng để map kết quả)",
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.addIndex("chat_messages", ["conversation_id"], {
      name: "idx_chat_msg_conv",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("chat_messages");
  },
};
