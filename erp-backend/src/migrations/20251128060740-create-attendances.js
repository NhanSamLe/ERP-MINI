"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("attendances", {
      id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },

      branch_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: "branches",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },

      employee_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: "employees",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },

      work_date: { type: Sequelize.DATEONLY, allowNull: false },
      check_in: { type: Sequelize.DATE },
      check_out: { type: Sequelize.DATE },
      working_hours: { type: Sequelize.DECIMAL(5, 2) },

      status: {
        type: Sequelize.ENUM("present", "absent", "leave", "late"),
        allowNull: false,
        defaultValue: "present",
      },

      note: { type: Sequelize.STRING(255) },

      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("CURRENT_TIMESTAMP"),
      },

      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.addIndex(
      "attendances",
      ["employee_id", "work_date"],
      {
        unique: true,
        name: "uq_attendance_employee_date",
      }
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable("attendances");
  },
};
