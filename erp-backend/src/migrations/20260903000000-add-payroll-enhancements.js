'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    // 1. Create cost_centers table
    await queryInterface.createTable("cost_centers", {
      id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      branch_id: { type: Sequelize.BIGINT, allowNull: false },
      code: { type: Sequelize.STRING(50), allowNull: false },
      name: { type: Sequelize.STRING(100), allowNull: false },
      status: {
        type: Sequelize.ENUM("active", "inactive"),
        allowNull: false,
        defaultValue: "active",
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });

    await queryInterface.addConstraint("cost_centers", {
      fields: ["branch_id", "code"],
      type: "unique",
      name: "uq_cost_centers_branch_code",
    });

    await queryInterface.addConstraint("cost_centers", {
      fields: ["branch_id"],
      type: "foreign key",
      name: "fk_cost_centers_branch",
      references: { table: "branches", field: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });

    // 2. Add cost_center_id to departments
    await queryInterface.addColumn("departments", "cost_center_id", {
      type: Sequelize.BIGINT,
      allowNull: true,
      after: "name",
    });

    await queryInterface.addConstraint("departments", {
      fields: ["cost_center_id"],
      type: "foreign key",
      name: "fk_departments_cost_center",
      references: { table: "cost_centers", field: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });

    // 3. Add cost_center_id to gl_entry_lines
    await queryInterface.addColumn("gl_entry_lines", "cost_center_id", {
      type: Sequelize.BIGINT,
      allowNull: true,
      after: "partner_id",
    });

    await queryInterface.addConstraint("gl_entry_lines", {
      fields: ["cost_center_id"],
      type: "foreign key",
      name: "fk_gl_entry_lines_cost_center",
      references: { table: "cost_centers", field: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });

    // 4. Create payroll_account_mappings table
    await queryInterface.createTable("payroll_account_mappings", {
      id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      branch_id: { type: Sequelize.BIGINT, allowNull: false },
      department_id: { type: Sequelize.BIGINT, allowNull: true },
      item_type: {
        type: Sequelize.ENUM(
          "salary",
          "social_insurance_company",
          "social_insurance_employee",
          "pit",
          "net_payable"
        ),
        allowNull: false,
      },
      account_id: { type: Sequelize.BIGINT, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });

    await queryInterface.addConstraint("payroll_account_mappings", {
      fields: ["branch_id"],
      type: "foreign key",
      name: "fk_payroll_account_mappings_branch",
      references: { table: "branches", field: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });

    await queryInterface.addConstraint("payroll_account_mappings", {
      fields: ["department_id"],
      type: "foreign key",
      name: "fk_payroll_account_mappings_department",
      references: { table: "departments", field: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });

    await queryInterface.addConstraint("payroll_account_mappings", {
      fields: ["account_id"],
      type: "foreign key",
      name: "fk_payroll_account_mappings_account",
      references: { table: "gl_accounts", field: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });

    // 5. Add approval fields to payroll_runs
    await queryInterface.addColumn("payroll_runs", "approval_status", {
      type: Sequelize.ENUM(
        "draft",
        "waiting_chief_accountant",
        "waiting_ceo",
        "approved",
        "rejected"
      ),
      allowNull: false,
      defaultValue: "draft",
      after: "status",
    });

    await queryInterface.addColumn("payroll_runs", "submitted_at", {
      type: Sequelize.DATE,
      allowNull: true,
      after: "approval_status",
    });

    await queryInterface.addColumn("payroll_runs", "approved_by", {
      type: Sequelize.BIGINT,
      allowNull: true,
      after: "submitted_at",
    });

    await queryInterface.addColumn("payroll_runs", "approved_at", {
      type: Sequelize.DATE,
      allowNull: true,
      after: "approved_by",
    });

    await queryInterface.addColumn("payroll_runs", "reject_reason", {
      type: Sequelize.STRING(255),
      allowNull: true,
      after: "approved_at",
    });

    await queryInterface.addConstraint("payroll_runs", {
      fields: ["approved_by"],
      type: "foreign key",
      name: "fk_payroll_runs_approved_by",
      references: { table: "users", field: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove constraints first
    await queryInterface.removeConstraint("payroll_runs", "fk_payroll_runs_approved_by");
    await queryInterface.removeColumn("payroll_runs", "reject_reason");
    await queryInterface.removeColumn("payroll_runs", "approved_at");
    await queryInterface.removeColumn("payroll_runs", "approved_by");
    await queryInterface.removeColumn("payroll_runs", "submitted_at");
    await queryInterface.removeColumn("payroll_runs", "approval_status");

    // Clean enum if MySQL
    await queryInterface.sequelize.query(`ALTER TABLE payroll_runs MODIFY approval_status VARCHAR(50);`);

    await queryInterface.dropTable("payroll_account_mappings");

    await queryInterface.removeConstraint("gl_entry_lines", "fk_gl_entry_lines_cost_center");
    await queryInterface.removeColumn("gl_entry_lines", "cost_center_id");

    await queryInterface.removeConstraint("departments", "fk_departments_cost_center");
    await queryInterface.removeColumn("departments", "cost_center_id");

    await queryInterface.dropTable("cost_centers");
  },
};
