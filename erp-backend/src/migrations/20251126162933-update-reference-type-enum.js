"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Xóa enum cũ nếu trường đang là enum
    await queryInterface.changeColumn("stock_moves", "reference_type", {
      type: Sequelize.ENUM(
        "purchase_order",
        "sale_order",
        "transfer",
        "adjustment"
      ),
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    // Nếu rollback thì chuyển về string(50)
    await queryInterface.changeColumn("stock_moves", "reference_type", {
      type: Sequelize.STRING(50),
      allowNull: true,
    });

    // Xóa ENUM được Sequelize auto tạo trong Postgres/MySQL (optional)
    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS "enum_stock_moves_reference_type";`
    );
  },
};
