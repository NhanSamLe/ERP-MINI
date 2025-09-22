'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("employees", {
      id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      branch_id: { type: Sequelize.BIGINT, allowNull: false },
      emp_code: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      full_name: { type: Sequelize.STRING(100), allowNull: false },
      gender: { type: Sequelize.ENUM("male", "female", "other"), allowNull: false },
      birth_date: { type: Sequelize.DATE },
      cccd: { type: Sequelize.STRING(20) },
      hire_date: { type: Sequelize.DATE },
      contract_type: { type: Sequelize.ENUM("trial", "official", "seasonal"), allowNull: false },
      department_id: { type: Sequelize.BIGINT },
      position_id: { type: Sequelize.BIGINT },
      base_salary: { type: Sequelize.DECIMAL(18, 2), allowNull: false },
      bank_account: { type: Sequelize.STRING(50) },
      bank_name: { type: Sequelize.STRING(100) },
      status: { type: Sequelize.ENUM("active", "inactive"), defaultValue: "active" },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });

    await queryInterface.addConstraint("employees", {
      fields: ["branch_id"],
      type: "foreign key",
      name: "fk_employees_branch",
      references: { table: "branches", field: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });

    await queryInterface.addConstraint("employees", {
      fields: ["department_id"],
      type: "foreign key",
      name: "fk_employees_department",
      references: { table: "departments", field: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });

    await queryInterface.addConstraint("employees", {
      fields: ["position_id"],
      type: "foreign key",
      name: "fk_employees_position",
      references: { table: "positions", field: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("employees");
  },
};
