"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("ai_narrative_cache", {
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
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      period_start: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      period_end: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      data_hash: {
        type: Sequelize.STRING(64),
        allowNull: false,
      },
      narrative_text: {
        type: Sequelize.TEXT("long"),
        allowNull: false,
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      ttl_expires_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    });

    // Create indexes
    await queryInterface.addIndex(
      "ai_narrative_cache",
      ["company_id", "narrative_type", "period_start", "period_end"],
      { name: "idx_cache_lookup" },
    );
    await queryInterface.addIndex("ai_narrative_cache", ["ttl_expires_at"]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("ai_narrative_cache");
  },
};
