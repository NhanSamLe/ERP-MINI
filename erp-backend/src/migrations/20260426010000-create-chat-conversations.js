"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("chat_conversations", {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
      },
      branch_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: "Tiêu đề hội thoại (lấy từ tin nhắn đầu hoặc tự động tạo)",
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal(
          "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
        ),
      },
    });

    await queryInterface.addIndex("chat_conversations", ["user_id"], {
      name: "idx_chat_conv_user",
    });
    await queryInterface.addIndex("chat_conversations", ["branch_id"], {
      name: "idx_chat_conv_branch",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("chat_conversations");
  },
};
