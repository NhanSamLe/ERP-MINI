"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("ai_narrative_logs", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      company_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: "companies",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      user_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      narrative_type: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      period_start: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      period_end: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      input_data: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      output_narrative: {
        type: Sequelize.TEXT("long"),
        allowNull: true,
      },
      tokens_used: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      cost_usd: {
        type: Sequelize.DECIMAL(10, 4),
        allowNull: true,
      },
      generation_time_ms: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM("success", "failed", "partial"),
        defaultValue: "success",
      },
      error_message: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    });

    // Create indexes
    await queryInterface.addIndex("ai_narrative_logs", ["company_id"]);
    await queryInterface.addIndex("ai_narrative_logs", ["user_id"]);
    await queryInterface.addIndex("ai_narrative_logs", ["narrative_type"]);
    await queryInterface.addIndex("ai_narrative_logs", ["status"]);
    await queryInterface.addIndex("ai_narrative_logs", ["created_at"]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("ai_narrative_logs");
  },
};
