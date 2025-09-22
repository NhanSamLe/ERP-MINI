'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("payroll_run_lines", {
      id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      run_id: { type: Sequelize.BIGINT, allowNull: false },
      employee_id: { type: Sequelize.BIGINT, allowNull: false },
      amount: { type: Sequelize.DECIMAL(18, 2), allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });

    await queryInterface.addConstraint("payroll_run_lines", {
      fields: ["run_id"],
      type: "foreign key",
      name: "fk_payroll_run_lines_run",
      references: { table: "payroll_runs", field: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });

    await queryInterface.addConstraint("payroll_run_lines", {
      fields: ["employee_id"],
      type: "foreign key",
      name: "fk_payroll_run_lines_employee",
      references: { table: "employees", field: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("payroll_run_lines");
  },
};
