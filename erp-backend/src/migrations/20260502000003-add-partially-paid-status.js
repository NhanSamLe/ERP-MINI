"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const sequelize = queryInterface.sequelize;
    const dialect = sequelize.options.dialect;

    if (dialect === "postgres") {
      // PostgreSQL - Thêm ENUM value
      await sequelize.query(
        `ALTER TYPE enum_ap_invoices_status ADD VALUE 'partially_paid' BEFORE 'paid'`,
      );
    } else if (dialect === "mysql" || dialect === "mysql2") {
      // MySQL - Modify column
      await sequelize.query(
        `ALTER TABLE ap_invoices MODIFY COLUMN status ENUM('draft', 'posted', 'partially_paid', 'paid', 'cancelled') DEFAULT 'draft'`,
      );
    } else if (dialect === "sqlite") {
      // SQLite - Không hỗ trợ ENUM, bỏ qua
      console.log("SQLite does not support ENUM, skipping migration");
    }
  },

  async down(queryInterface, Sequelize) {
    const sequelize = queryInterface.sequelize;
    const dialect = sequelize.options.dialect;

    if (dialect === "mysql" || dialect === "mysql2") {
      // MySQL - Revert column
      await sequelize.query(
        `ALTER TABLE ap_invoices MODIFY COLUMN status ENUM('draft', 'posted', 'paid', 'cancelled') DEFAULT 'draft'`,
      );
    }
    // PostgreSQL: Không thể rollback ENUM value
    // SQLite: Không cần rollback
  },
};
