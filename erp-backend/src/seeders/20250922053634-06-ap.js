"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    // Lấy dữ liệu tham chiếu
    const [partners] = await queryInterface.sequelize.query(`SELECT id, type FROM partners;`);
    const [products] = await queryInterface.sequelize.query(`SELECT id, sku FROM products;`);
    const [taxRates] = await queryInterface.sequelize.query(`SELECT id, code FROM tax_rates;`);
    const [branches] = await queryInterface.sequelize.query(`SELECT id FROM branches;`);

    function getSupplier() {
      return partners.find((p) => p.type === "supplier").id;
    }
    function getProduct(sku) {
      return products.find((p) => p.sku === sku).id;
    }
    function getTax(code) {
      return taxRates.find((t) => t.code === code).id;
    }
    const branchId = branches[0].id;

    // 1. Purchase Orders
    await queryInterface.bulkInsert("purchase_orders", [
      {
        branch_id: branchId,
        po_no: "PO001",
        supplier_id: getSupplier(),
        order_date: new Date(),
        total_before_tax: 800,
        total_tax: 80,
        total_after_tax: 880,
        status: "confirmed",
        created_at: now,
        updated_at: now,
      },
      {
        branch_id: branchId,
        po_no: "PO002",
        supplier_id: getSupplier(),
        order_date: new Date(),
        total_before_tax: 1500,
        total_tax: 150,
        total_after_tax: 1650,
        status: "draft",
        created_at: now,
        updated_at: now,
      },
    ]);

    const [orders] = await queryInterface.sequelize.query(`SELECT id, po_no FROM purchase_orders;`);

    function getPO(no) {
      return orders.find((o) => o.po_no === no).id;
    }

    // 2. Purchase Order Lines
    await queryInterface.bulkInsert("purchase_order_lines", [
      {
        po_id: getPO("PO001"),
        product_id: getProduct("LAP001"),
        quantity: 2,
        unit_price: 400,
        tax_rate_id: getTax("VAT10"),
        line_total: 880,
        created_at: now,
        updated_at: now,
      },
      {
        po_id: getPO("PO002"),
        product_id: getProduct("PHN001"),
        quantity: 1,
        unit_price: 1500,
        tax_rate_id: getTax("VAT10"),
        line_total: 1650,
        created_at: now,
        updated_at: now,
      },
    ]);

    // 3. AP Invoices
    await queryInterface.bulkInsert("ap_invoices", [
      {
        po_id: getPO("PO001"),
        invoice_no: "PINV001",
        invoice_date: new Date(),
        due_date: new Date(new Date().setDate(now.getDate() + 30)), // 30 ngày
        total_before_tax: 800,
        total_tax: 80,
        total_after_tax: 880,
        status: "posted",
        created_at: now,
        updated_at: now,
      },
      {
        po_id: getPO("PO002"),
        invoice_no: "PINV002",
        invoice_date: new Date(),
        due_date: new Date(new Date().setDate(now.getDate() + 30)),
        total_before_tax: 1500,
        total_tax: 150,
        total_after_tax: 1650,
        status: "draft",
        created_at: now,
        updated_at: now,
      },
    ]);

    const [apInvoices] = await queryInterface.sequelize.query(`SELECT id, invoice_no FROM ap_invoices;`);

    function getAPInvoice(no) {
      return apInvoices.find((i) => i.invoice_no === no).id;
    }

    // 4. AP Invoice Lines
    await queryInterface.bulkInsert("ap_invoice_lines", [
      {
        ap_invoice_id: getAPInvoice("PINV001"),
        product_id: getProduct("LAP001"),
        description: "Dell Inspiron nhập về",
        quantity: 2,
        unit_price: 400,
        tax_rate_id: getTax("VAT10"),
        line_total: 880,
        created_at: now,
        updated_at: now,
      },
      {
        ap_invoice_id: getAPInvoice("PINV002"),
        product_id: getProduct("PHN001"),
        description: "iPhone 15 nhập về",
        quantity: 1,
        unit_price: 1500,
        tax_rate_id: getTax("VAT10"),
        line_total: 1650,
        created_at: now,
        updated_at: now,
      },
    ]);

    // 5. AP Payments
    await queryInterface.bulkInsert("ap_payments", [
      {
        payment_no: "PAY001",
        supplier_id: getSupplier(),
        payment_date: new Date(),
        amount: 880,
        method: "bank",
        status: "posted",
        created_at: now,
        updated_at: now,
      },
      {
        payment_no: "PAY002",
        supplier_id: getSupplier(),
        payment_date: new Date(),
        amount: 800,
        method: "cash",
        status: "draft",
        created_at: now,
        updated_at: now,
      },
    ]);

    const [payments] = await queryInterface.sequelize.query(`SELECT id, payment_no FROM ap_payments;`);

    function getPayment(no) {
      return payments.find((p) => p.payment_no === no).id;
    }

    // 6. AP Payment Allocations
    await queryInterface.bulkInsert("ap_payment_allocations", [
      {
        payment_id: getPayment("PAY001"),
        ap_invoice_id: getAPInvoice("PINV001"),
        applied_amount: 880,
        created_at: now,
        updated_at: now,
      },
      {
        payment_id: getPayment("PAY002"),
        ap_invoice_id: getAPInvoice("PINV002"),
        applied_amount: 800, // mới trả 1 phần
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("ap_payment_allocations", null, {});
    await queryInterface.bulkDelete("ap_payments", null, {});
    await queryInterface.bulkDelete("ap_invoice_lines", null, {});
    await queryInterface.bulkDelete("ap_invoices", null, {});
    await queryInterface.bulkDelete("purchase_order_lines", null, {});
    await queryInterface.bulkDelete("purchase_orders", null, {});
  },
};
