"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("crm_leads", "score_grade", {
      type: Sequelize.ENUM("cold", "warm", "hot"),
      allowNull: true,
    });

    await queryInterface.addColumn("crm_leads", "score_reasons", {
      type: Sequelize.JSON,
      allowNull: true,
    });

    await queryInterface.addColumn("crm_leads", "last_scored_at", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.changeColumn("crm_scoring_rules", "operator", {
      type: Sequelize.ENUM(
        "equals",
        "not_equals",
        "contains",
        "greater_than",
        "less_than",
        "greater_than_or_equal",
        "less_than_or_equal",
        "is_true",
        "is_false",
        "not_empty",
        "empty",
        "in"
      ),
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("crm_leads", "last_scored_at");
    await queryInterface.removeColumn("crm_leads", "score_reasons");
    await queryInterface.removeColumn("crm_leads", "score_grade");

    await queryInterface.changeColumn("crm_scoring_rules", "operator", {
      type: Sequelize.ENUM("equals", "not_equals", "contains", "greater_than", "less_than", "is_true", "is_false"),
      allowNull: false,
    });
  },
};
