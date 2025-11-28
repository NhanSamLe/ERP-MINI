"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("crm_leads", "contacted_at", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn("crm_leads", "qualified_at", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn("crm_leads", "qualified_by", {
      type: Sequelize.BIGINT,
      allowNull: true,
    });

    await queryInterface.addColumn("crm_leads", "lost_at", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn("crm_leads", "lost_reason", {
      type: Sequelize.STRING(255),
      allowNull: true,
    });

    await queryInterface.addColumn("crm_leads", "has_budget", {
      type: Sequelize.BOOLEAN,
      allowNull: true,
    });

    await queryInterface.addColumn("crm_leads", "ready_to_buy", {
      type: Sequelize.BOOLEAN,
      allowNull: true,
    });

    await queryInterface.addColumn("crm_leads", "expected_timeline", {
      type: Sequelize.STRING(50),
      allowNull: true,
    });

    // FK cho qualified_by (optional)
    await queryInterface.addConstraint("crm_leads", {
      fields: ["qualified_by"],
      type: "foreign key",
      name: "fk_leads_qualified_by",
      references: { table: "users", field: "id" },
      onDelete: "SET NULL",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeConstraint("crm_leads", "fk_leads_qualified_by");

    await queryInterface.removeColumn("crm_leads", "contacted_at");
    await queryInterface.removeColumn("crm_leads", "qualified_at");
    await queryInterface.removeColumn("crm_leads", "qualified_by");
    await queryInterface.removeColumn("crm_leads", "lost_at");
    await queryInterface.removeColumn("crm_leads", "lost_reason");
    await queryInterface.removeColumn("crm_leads", "has_budget");
    await queryInterface.removeColumn("crm_leads", "ready_to_buy");
    await queryInterface.removeColumn("crm_leads", "expected_timeline");
  }
};
