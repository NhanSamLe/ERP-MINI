"use strict";

/**
 * Fix: ap_payments.status ENUM thiếu 'completed'
 * Migration trước (create-ap-payments) chỉ có: draft, posted, cancelled
 * Cần thêm 'completed' để payment có thể chuyển sang COMPLETED sau khi allocate hết
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.options.dialect;

    if (dialect === "mysql" || dialect === "mysql2") {
      await queryInterface.sequelize.query(
        `ALTER TABLE ap_payments MODIFY COLUMN status ENUM('draft','posted','completed','cancelled') DEFAULT 'draft'`,
      );
    }
    // PostgreSQL: ALTER TYPE ... ADD VALUE (nếu cần)
    // SQLite: không hỗ trợ ENUM
  },

  async down(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.options.dialect;

    if (dialect === "mysql" || dialect === "mysql2") {
      await queryInterface.sequelize.query(
        `ALTER TABLE ap_payments MODIFY COLUMN status ENUM('draft','posted','cancelled') DEFAULT 'draft'`,
      );
    }
  },
};
