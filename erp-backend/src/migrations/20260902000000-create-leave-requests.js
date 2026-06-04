'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("leave_requests", {
      id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      employee_id: { type: Sequelize.BIGINT, allowNull: false },
      branch_id: { type: Sequelize.BIGINT, allowNull: false },
      start_date: { type: Sequelize.DATEONLY, allowNull: false },
      end_date: { type: Sequelize.DATEONLY, allowNull: false },
      half_day: {
        type: Sequelize.ENUM("none", "morning", "afternoon"),
        allowNull: false,
        defaultValue: "none"
      },
      leave_type: {
        type: Sequelize.ENUM("annual", "sick", "unpaid", "maternity"),
        allowNull: false,
        defaultValue: "annual"
      },
      reason: { type: Sequelize.STRING(255), allowNull: true },
      status: {
        type: Sequelize.ENUM("pending", "approved", "rejected"),
        allowNull: false,
        defaultValue: "pending"
      },
      approved_by: { type: Sequelize.BIGINT, allowNull: true },
      approved_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });

    await queryInterface.addConstraint("leave_requests", {
      fields: ["employee_id"],
      type: "foreign key",
      name: "fk_leave_requests_employee",
      references: { table: "employees", field: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });

    await queryInterface.addConstraint("leave_requests", {
      fields: ["branch_id"],
      type: "foreign key",
      name: "fk_leave_requests_branch",
      references: { table: "branches", field: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("leave_requests");
  },
};
