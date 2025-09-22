'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("payroll_periods", {
      id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      branch_id: { type: Sequelize.BIGINT, allowNull: false },
      period_code: { type: Sequelize.STRING(20), allowNull: false },
      start_date: { type: Sequelize.DATE, allowNull: false },
      end_date: { type: Sequelize.DATE, allowNull: false },
      status: { type: Sequelize.ENUM("open", "processed", "closed"), defaultValue: "open" },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });

    await queryInterface.addConstraint("payroll_periods", {
      fields: ["branch_id"],
      type: "foreign key",
      name: "fk_payroll_periods_branch",
      references: { table: "branches", field: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("payroll_periods");
  },
};
