"use strict";

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert("payment_terms", [
      { code: "IMMEDIATE", name: "Thanh toán ngay", days: 0, description: "Thanh toán khi giao hàng", is_active: 1, created_at: now, updated_at: now },
      { code: "NET15", name: "Net 15", days: 15, description: "Thanh toán trong 15 ngày", is_active: 1, created_at: now, updated_at: now },
      { code: "NET30", name: "Net 30", days: 30, description: "Thanh toán trong 30 ngày", is_active: 1, created_at: now, updated_at: now },
      { code: "NET45", name: "Net 45", days: 45, description: "Thanh toán trong 45 ngày", is_active: 1, created_at: now, updated_at: now },
      { code: "NET60", name: "Net 60", days: 60, description: "Thanh toán trong 60 ngày", is_active: 1, created_at: now, updated_at: now },
      { code: "NET90", name: "Net 90", days: 90, description: "Thanh toán trong 90 ngày", is_active: 1, created_at: now, updated_at: now },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("payment_terms", null, {});
  },
};
