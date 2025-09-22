"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    // 1. Product Categories
    await queryInterface.bulkInsert("product_categories", [
      { name: "Electronics", parent_id: null, created_at: now, updated_at: now },
      { name: "Laptops", parent_id: null, created_at: now, updated_at: now },
      { name: "Smartphones", parent_id: null, created_at: now, updated_at: now },
    ]);

    const [categories] = await queryInterface.sequelize.query(
      `SELECT id, name FROM product_categories;`
    );
    function getCategoryId(name) {
      return categories.find((c) => c.name === name).id;
    }

    // 2. Products
    const [taxRates] = await queryInterface.sequelize.query(`SELECT id, code FROM tax_rates;`);
    function getTaxId(code) {
      return taxRates.find((t) => t.code === code).id;
    }

    await queryInterface.bulkInsert("products", [
      {
        category_id: getCategoryId("Laptops"),
        sku: "LAP001",
        name: "Dell Inspiron 15",
        barcode: "1234567890",
        uom: "PCS",
        origin: "China",
        cost_price: 500.0,
        sale_price: 650.0,
        tax_rate_id: getTaxId("VAT10"),
        status: "active",
        created_at: now,
        updated_at: now,
      },
      {
        category_id: getCategoryId("Smartphones"),
        sku: "PHN001",
        name: "iPhone 15",
        barcode: "2345678901",
        uom: "PCS",
        origin: "Vietnam",
        cost_price: 900.0,
        sale_price: 1200.0,
        tax_rate_id: getTaxId("VAT10"),
        status: "active",
        created_at: now,
        updated_at: now,
      },
      {
        category_id: getCategoryId("Electronics"),
        sku: "TV001",
        name: "Samsung Smart TV 55 inch",
        barcode: "3456789012",
        uom: "PCS",
        origin: "Korea",
        cost_price: 400.0,
        sale_price: 600.0,
        tax_rate_id: getTaxId("VAT5"),
        status: "active",
        created_at: now,
        updated_at: now,
      },
    ]);

    // 3. Partners (Customers, Suppliers, Internal)
    await queryInterface.bulkInsert("partners", [
      {
        type: "customer",
        name: "Nguyen Van A",
        contact_person: "Nguyen Van A",
        phone: "0909123456",
        email: "customer1@example.com",
        tax_code: "CUST123",
        cccd: "0123456789",
        address: "123 Street, District 1, HCMC",
        province: "HCMC",
        district: "District 1",
        ward: "Ward 1",
        bank_account: "123456789",
        bank_name: "Vietcombank",
        status: "active",
        created_at: now,
        updated_at: now,
      },
      {
        type: "supplier",
        name: "ABC Supplies Ltd",
        contact_person: "Tran Van B",
        phone: "0909888777",
        email: "supplier1@example.com",
        tax_code: "SUP123",
        cccd: null,
        address: "456 Street, District 3, HCMC",
        province: "HCMC",
        district: "District 3",
        ward: "Ward 5",
        bank_account: "987654321",
        bank_name: "Techcombank",
        status: "active",
        created_at: now,
        updated_at: now,
      },
      {
        type: "internal",
        name: "UTE ERP Internal",
        contact_person: "System Admin",
        phone: "0909777666",
        email: "internal@uteerp.com",
        tax_code: "INT001",
        cccd: null,
        address: "UTE Campus, Thu Duc",
        province: "HCMC",
        district: "Thu Duc",
        ward: "Linh Trung",
        bank_account: "555666777",
        bank_name: "BIDV",
        status: "active",
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("partners", null, {});
    await queryInterface.bulkDelete("products", null, {});
    await queryInterface.bulkDelete("product_categories", null, {});
  },
};
