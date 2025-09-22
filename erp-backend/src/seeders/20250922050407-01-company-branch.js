"use strict";

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    // Company (1 record duy nhất)
    await queryInterface.bulkInsert("companies", [
      {
        code: "C01",
        name: "UTE ERP Company",
        tax_code: "0312345678",
        address: "1 Vo Van Ngan, Thu Duc, HCM",
        province: "HCM",
        district: "Thu Duc",
        ward: "Linh Trung",
        phone: "0281234567",
        email: "info@uteerp.com",
        website: "https://uteerp.com",
        bank_account: "123456789",
        bank_name: "VCB",
        created_at: now,
        updated_at: now,
      },
    ]);

    // Lấy id company để tạo branches
    const [companies] = await queryInterface.sequelize.query(
      `SELECT id FROM companies WHERE code = 'C01';`
    );
    const companyId = companies[0].id;

    await queryInterface.bulkInsert("branches", [
      {
        company_id: companyId,
        code: "BR01",
        name: "Main Branch",
        address: "1 Vo Van Ngan",
        province: "HCM",
        district: "Thu Duc",
        ward: "Linh Trung",
        tax_code: "BR123",
        bank_account: "987654321",
        bank_name: "ACB",
        status: "active",
        created_at: now,
        updated_at: now,
      },
      {
        company_id: companyId,
        code: "BR02",
        name: "Branch 2",
        address: "Quan 1",
        province: "HCM",
        district: "Q1",
        ward: "Ben Nghe",
        tax_code: "BR456",
        bank_account: "456789123",
        bank_name: "VCB",
        status: "inactive",
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("branches", null, {});
    await queryInterface.bulkDelete("companies", null, {});
  },
};
