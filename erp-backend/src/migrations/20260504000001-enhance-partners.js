"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("partners", "credit_limit", {
      type: Sequelize.DECIMAL(18, 2),
      defaultValue: 0,
    });
    await queryInterface.addColumn("partners", "payment_term_id", {
      type: Sequelize.BIGINT,
      references: { model: "payment_terms", key: "id" },
      allowNull: true,
    });
    await queryInterface.addColumn("partners", "currency_id", {
      type: Sequelize.BIGINT,
      references: { model: "currencies", key: "id" },
      allowNull: true,
    });
    await queryInterface.addColumn("partners", "is_customer", {
      type: Sequelize.TINYINT(1),
      defaultValue: 0,
    });
    await queryInterface.addColumn("partners", "is_supplier", {
      type: Sequelize.TINYINT(1),
      defaultValue: 0,
    });
    await queryInterface.addColumn("partners", "website", {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
    await queryInterface.addColumn("partners", "industry", {
      type: Sequelize.STRING(100),
      allowNull: true,
    });
    await queryInterface.addColumn("partners", "company_size", {
      type: Sequelize.STRING(50),
      allowNull: true,
    });
    await queryInterface.addColumn("partners", "sales_person_id", {
      type: Sequelize.BIGINT,
      references: { model: "users", key: "id" },
      allowNull: true,
    });
  },

  async down(queryInterface) {
    const cols = [
      "credit_limit", "payment_term_id", "currency_id", "is_customer",
      "is_supplier", "website", "industry", "company_size", "sales_person_id",
    ];
    for (const col of cols) {
      await queryInterface.removeColumn("partners", col);
    }
  },
};
