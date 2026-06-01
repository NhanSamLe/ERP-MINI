"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("anomaly_threshold_configs", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      branch_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
      },
      z_score_threshold: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 3.0,
      },
      iqr_multiplier: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 1.5,
      },
      frequency_threshold_per_hour: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 3,
      },
      approval_threshold_vnd: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      high_risk_score_threshold: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0.7,
      },
      medium_risk_score_threshold: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0.4,
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      updated_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
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

    // Unique index on branch_id
    await queryInterface.addIndex("anomaly_threshold_configs", ["branch_id"], {
      name: "idx_anomaly_threshold_configs_branch_id",
      unique: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex(
      "anomaly_threshold_configs",
      "idx_anomaly_threshold_configs_branch_id",
    );
    await queryInterface.dropTable("anomaly_threshold_configs");
  },
};
