"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("crm_leads", "customer_id", {
      type: Sequelize.BIGINT,
      allowNull: true,
      references: { model: "partners", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("crm_leads", "customer_id");
  },
};
