"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // LEAD
    await queryInterface.addColumn("crm_leads", "is_deleted", {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });
    await queryInterface.addColumn("crm_leads", "deleted_at", {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn("crm_leads", "deleted_by", {
      type: Sequelize.BIGINT,
      allowNull: true,
    });

    // OPPORTUNITY
    await queryInterface.addColumn("crm_opportunities", "is_deleted", {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });
    await queryInterface.addColumn("crm_opportunities", "deleted_at", {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn("crm_opportunities", "deleted_by", {
      type: Sequelize.BIGINT,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    // rollback
    await queryInterface.removeColumn("crm_leads", "is_deleted");
    await queryInterface.removeColumn("crm_leads", "deleted_at");
    await queryInterface.removeColumn("crm_leads", "deleted_by");

    await queryInterface.removeColumn("crm_opportunities", "is_deleted");
    await queryInterface.removeColumn("crm_opportunities", "deleted_at");
    await queryInterface.removeColumn("crm_opportunities", "deleted_by");
  },
};
