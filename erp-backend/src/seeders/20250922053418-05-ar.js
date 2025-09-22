"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    // Lấy dữ liệu tham chiếu
    const [orders] = await queryInterface.sequelize.query(`SELECT id, order_no FROM sale_orders;`);
    const [products] = await queryInterface.sequelize.query(`SELECT id, sku FROM products;`);
    const [taxRates] = await queryInterface.sequelize.query(`SELECT id, code FROM tax_rates;`);
    const [partners] = await queryInterface.sequelize.query(`SELECT id, type FROM partners;`);

    function getOrder(orderNo) {
      return orders.find((o) => o.order_no === orderNo).id;
    }
    function getProduct(sku) {
      return products.find((p) => p.sku === sku).id;
    }
    function getTax(code) {
      return taxRates.find((t) => t.code === code).id;
    }
    function getCustomer() {
      return partners.find((p) => p.type === "customer").id;
    }

    // 1. AR Invoices
    await queryInterface.bulkInsert("ar_invoices", [
      {
        order_id: getOrder("SO001"),
        invoice_no: "INV001",
        invoice_date: new Date(),
        total_before_tax: 1000, // 2 * 500
        total_tax: 100,         // 10%
        total_after_tax: 1100,
        status: "posted",
        created_at: now,
        updated_at: now,
      },
      {
        order_id: getOrder("SO002"),
        invoice_no: "INV002",
        invoice_date: new Date(),
        total_before_tax: 2000, // 1 * 2000
        total_tax: 200,
        total_after_tax: 2200,
        status: "draft",
        created_at: now,
        updated_at: now,
      },
    ]);

    const [invoices] = await queryInterface.sequelize.query(`SELECT id, invoice_no FROM ar_invoices;`);

    function getInvoice(no) {
      return invoices.find((i) => i.invoice_no === no).id;
    }

    // 2. AR Invoice Lines
    await queryInterface.bulkInsert("ar_invoice_lines", [
      {
        invoice_id: getInvoice("INV001"),
        product_id: getProduct("LAP001"),
        description: "Dell Inspiron 15",
        quantity: 2,
        unit_price: 500,
        tax_rate_id: getTax("VAT10"),
        line_total: 1000,
        created_at: now,
        updated_at: now,
      },
      {
        invoice_id: getInvoice("INV002"),
        product_id: getProduct("PHN001"),
        description: "iPhone 15",
        quantity: 1,
        unit_price: 2000,
        tax_rate_id: getTax("VAT10"),
        line_total: 2000,
        created_at: now,
        updated_at: now,
      },
    ]);

    // 3. AR Receipts
    await queryInterface.bulkInsert("ar_receipts", [
      {
        receipt_no: "RCPT001",
        customer_id: getCustomer(),
        receipt_date: new Date(),
        amount: 1100, // full payment for INV001
        method: "cash",
        status: "posted",
        created_at: now,
        updated_at: now,
      },
      {
        receipt_no: "RCPT002",
        customer_id: getCustomer(),
        receipt_date: new Date(),
        amount: 1000, // partial payment for INV002
        method: "bank",
        status: "draft",
        created_at: now,
        updated_at: now,
      },
    ]);

    const [receipts] = await queryInterface.sequelize.query(`SELECT id, receipt_no FROM ar_receipts;`);

    function getReceipt(no) {
      return receipts.find((r) => r.receipt_no === no).id;
    }

    // 4. AR Receipt Allocations
    await queryInterface.bulkInsert("ar_receipt_allocations", [
      {
        receipt_id: getReceipt("RCPT001"),
        invoice_id: getInvoice("INV001"),
        applied_amount: 1100,
        created_at: now,
        updated_at: now,
      },
      {
        receipt_id: getReceipt("RCPT002"),
        invoice_id: getInvoice("INV002"),
        applied_amount: 1000, // mới trả một phần
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("ar_receipt_allocations", null, {});
    await queryInterface.bulkDelete("ar_receipts", null, {});
    await queryInterface.bulkDelete("ar_invoice_lines", null, {});
    await queryInterface.bulkDelete("ar_invoices", null, {});
  },
};
