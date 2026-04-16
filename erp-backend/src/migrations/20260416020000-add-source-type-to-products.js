"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("products", "source_type", {
      type: Sequelize.ENUM("purchased", "manufactured"),
      allowNull: false,
      defaultValue: "purchased",
      after: "product_type",
      comment:
        "Nguồn gốc sản phẩm: purchased=mua từ NCC, manufactured=nội bộ sản xuất",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("products", "source_type");
  },
};
