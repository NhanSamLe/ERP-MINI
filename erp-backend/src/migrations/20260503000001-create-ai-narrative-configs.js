"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("ai_narrative_configs", {
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
      narrative_type: {
        type: Sequelize.ENUM(
          "monthly_report",
          "sales_performance",
          "vendor_performance",
          "cash_flow",
        ),
        allowNull: false,
      },
      template_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      prompt_template: {
        type: Sequelize.TEXT("long"),
        allowNull: false,
      },
      tone: {
        type: Sequelize.ENUM("formal", "casual", "analytical"),
        defaultValue: "analytical",
      },
      language: {
        type: Sequelize.STRING(10),
        defaultValue: "vi",
      },
      max_tokens: {
        type: Sequelize.INTEGER,
        defaultValue: 500,
      },
      temperature: {
        type: Sequelize.FLOAT,
        defaultValue: 0.7,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    });

    // Create indexes
    await queryInterface.addIndex("ai_narrative_configs", ["company_id"]);
    await queryInterface.addIndex("ai_narrative_configs", [
      "company_id",
      "narrative_type",
    ]);
    await queryInterface.addIndex("ai_narrative_configs", ["is_active"]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("ai_narrative_configs");
  },
};
