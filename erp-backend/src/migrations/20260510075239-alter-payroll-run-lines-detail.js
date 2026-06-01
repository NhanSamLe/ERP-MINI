'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("payroll_run_lines", "present_days", {
      type: Sequelize.INTEGER,
      defaultValue: 0,
    });

    await queryInterface.addColumn("payroll_run_lines", "absent_days", {
      type: Sequelize.INTEGER,
      defaultValue: 0,
    });

    await queryInterface.addColumn("payroll_run_lines", "leave_days", {
      type: Sequelize.INTEGER,
      defaultValue: 0,
    });

    await queryInterface.addColumn("payroll_run_lines", "late_days", {
      type: Sequelize.INTEGER,
      defaultValue: 0,
    });

    await queryInterface.addColumn("payroll_run_lines", "base_salary", {
      type: Sequelize.DECIMAL(18, 2),
    });

    await queryInterface.addColumn("payroll_run_lines", "daily_rate", {
      type: Sequelize.DECIMAL(18, 2),
    });

    await queryInterface.addColumn("payroll_run_lines", "gross_amount", {
      type: Sequelize.DECIMAL(18, 2),
    });

    await queryInterface.addColumn("payroll_run_lines", "total_earning", {
      type: Sequelize.DECIMAL(18, 2),
    });

    await queryInterface.addColumn("payroll_run_lines", "total_deduction", {
      type: Sequelize.DECIMAL(18, 2),
    });

    await queryInterface.addColumn("payroll_run_lines", "pit_amount", {
      type: Sequelize.DECIMAL(18, 2),
      defaultValue: 0,
    });

    await queryInterface.addColumn("payroll_run_lines", "net_amount", {
      type: Sequelize.DECIMAL(18, 2),
    });
  },

  async down(queryInterface) {
    const cols = [
      "present_days",
      "absent_days",
      "leave_days",
      "late_days",
      "base_salary",
      "daily_rate",
      "gross_amount",
      "total_earning",
      "total_deduction",
      "pit_amount",
      "net_amount",
    ];

    for (const col of cols) {
      await queryInterface.removeColumn("payroll_run_lines", col);
    }
  },
};