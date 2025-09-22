'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("payroll_runs", {
      id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      period_id: { type: Sequelize.BIGINT, allowNull: false },
      run_no: { type: Sequelize.STRING(50), allowNull: false },
      status: { type: Sequelize.ENUM("draft", "posted"), defaultValue: "draft" },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });

    await queryInterface.addConstraint("payroll_runs", {
      fields: ["period_id"],
      type: "foreign key",
      name: "fk_payroll_runs_period",
      references: { table: "payroll_periods", field: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("payroll_runs");
  },
};
