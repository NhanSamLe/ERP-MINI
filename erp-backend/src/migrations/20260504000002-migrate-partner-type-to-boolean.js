"use strict";

module.exports = {
  async up(queryInterface) {
    // Migrate existing type ENUM → boolean flags
    await queryInterface.sequelize.query(
      `UPDATE partners SET is_customer = 1 WHERE type = 'customer'`
    );
    await queryInterface.sequelize.query(
      `UPDATE partners SET is_supplier = 1 WHERE type = 'supplier'`
    );
    // Giữ lại cột type (backward compat) — sẽ xóa sau khi FE đã sửa xong
  },

  async down() {
    // noop — dữ liệu đã migrate
  },
};
