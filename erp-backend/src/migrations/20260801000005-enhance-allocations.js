"use strict";
// Phase 1 — Bổ sung fields vào ap_payment_allocations và ar_receipt_allocations
// Thêm: allocation_date, notes, created_by cho cả 2 bảng
module.exports = {
  async up(queryInterface, Sequelize) {
    // ap_payment_allocations
    await queryInterface.addColumn("ap_payment_allocations", "allocation_date", {
      type: Sequelize.DATEONLY,
      allowNull: true,
      comment: "Ngày phân bổ, mặc định = ngày tạo",
    });
    await queryInterface.addColumn("ap_payment_allocations", "notes", {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.addColumn("ap_payment_allocations", "created_by", {
      type: Sequelize.BIGINT,
      allowNull: true,
      references: { model: "users", key: "id" },
      onDelete: "SET NULL",
    });

    // ar_receipt_allocations
    await queryInterface.addColumn("ar_receipt_allocations", "allocation_date", {
      type: Sequelize.DATEONLY,
      allowNull: true,
    });
    await queryInterface.addColumn("ar_receipt_allocations", "notes", {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.addColumn("ar_receipt_allocations", "created_by", {
      type: Sequelize.BIGINT,
      allowNull: true,
      references: { model: "users", key: "id" },
      onDelete: "SET NULL",
    });
  },
  async down(queryInterface) {
    for (const col of ["created_by", "notes", "allocation_date"]) {
      await queryInterface.removeColumn("ap_payment_allocations", col);
      await queryInterface.removeColumn("ar_receipt_allocations", col);
    }
  },
};
