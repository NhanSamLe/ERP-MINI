'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Thêm cột employee_id
    await queryInterface.addColumn("users", "employee_id", {
      type: Sequelize.BIGINT,
      allowNull: true,
      after: "role_id" // tuỳ DB, MySQL hỗ trợ AFTER
    });

    // 2. Thêm foreign key
    await queryInterface.addConstraint("users", {
      fields: ["employee_id"],
      type: "foreign key",
      name: "fk_users_employee",
      references: {
        table: "employees",
        field: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint("users", "fk_users_employee");
    await queryInterface.removeColumn("users", "employee_id");
  },
};
