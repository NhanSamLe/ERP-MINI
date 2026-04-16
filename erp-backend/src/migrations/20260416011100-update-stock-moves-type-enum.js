"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // MySQL yêu cầu changeColumn để cập nhật ENUM
    await queryInterface.changeColumn("stock_moves", "type", {
      type: Sequelize.ENUM(
        "receipt",
        "issue",
        "transfer",
        "adjustment",
        "scrap",
      ),
      allowNull: false,
      comment:
        "Loại phiếu kho: receipt=nhập, issue=xuất, transfer=chuyển kho, adjustment=điều chỉnh, scrap=hủy hàng",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("stock_moves", "type", {
      type: Sequelize.ENUM("receipt", "issue", "transfer", "adjustment"),
      allowNull: false,
    });
  },
};
