"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    // Lấy dữ liệu tham chiếu
    const [partners] = await queryInterface.sequelize.query(`SELECT id, type FROM partners;`);
    const [products] = await queryInterface.sequelize.query(`SELECT id, sku FROM products;`);
    const [branches] = await queryInterface.sequelize.query(`SELECT id FROM branches;`);
    const [warehouses] = await queryInterface.sequelize.query(`SELECT id, code FROM warehouses;`);
    const [taxRates] = await queryInterface.sequelize.query(`SELECT id, code FROM tax_rates;`);
    const [journals] = await queryInterface.sequelize.query(`SELECT id, code FROM gl_journals;`);
    const [accounts] = await queryInterface.sequelize.query(`SELECT id, code FROM gl_accounts;`);

    function getSupplier() {
      return partners.find((p) => p.type === "supplier").id;
    }
    function getProduct(sku) {
      return products.find((p) => p.sku === sku).id;
    }
    function getWarehouse(code) {
      return warehouses.find((w) => w.code === code).id;
    }
    function getTax(code) {
      return taxRates.find((t) => t.code === code).id;
    }
    function getJournal(code) {
      return journals.find((j) => j.code === code).id;
    }
    function getAccount(code) {
      return accounts.find((a) => a.code === code).id;
    }

    const branchId = branches[0].id;

    // 1. Purchase Order
    await queryInterface.bulkInsert("purchase_orders", [
      {
        branch_id: branchId,
        po_no: "PO-WF001",
        supplier_id: getSupplier(),
        order_date: new Date(),
        status: "confirmed",
        total_before_tax: 3000,
        total_tax: 300,
        total_after_tax: 3300,
        created_at: now,
        updated_at: now,
      },
    ]);
    const [poRow] = await queryInterface.sequelize.query(
      `SELECT id FROM purchase_orders WHERE po_no = 'PO-WF001';`
    );
    const poId = poRow[0].id;

    await queryInterface.bulkInsert("purchase_order_lines", [
      {
        po_id: poId,
        product_id: getProduct("PHN001"),
        quantity: 3,
        unit_price: 1000,
        tax_rate_id: getTax("VAT10"),
        line_total: 3000,
        created_at: now,
        updated_at: now,
      },
    ]);

    // 2. AP Invoice
    await queryInterface.bulkInsert("ap_invoices", [
      {
        po_id: poId,
        invoice_no: "PINV-WF001",
        invoice_date: new Date(),
        due_date: new Date(new Date().setDate(now.getDate() + 30)),
        total_before_tax: 3000,
        total_tax: 300,
        total_after_tax: 3300,
        status: "posted",
        created_at: now,
        updated_at: now,
      },
    ]);
    const [apInvoiceRow] = await queryInterface.sequelize.query(
      `SELECT id FROM ap_invoices WHERE invoice_no = 'PINV-WF001';`
    );
    const apInvoiceId = apInvoiceRow[0].id;

    await queryInterface.bulkInsert("ap_invoice_lines", [
      {
        ap_invoice_id: apInvoiceId,
        product_id: getProduct("PHN001"),
        description: "iPhone 15 nhập về",
        quantity: 3,
        unit_price: 1000,
        tax_rate_id: getTax("VAT10"),
        line_total: 3000,
        created_at: now,
        updated_at: now,
      },
    ]);

    // 3. AP Payment
    await queryInterface.bulkInsert("ap_payments", [
      {
        payment_no: "PAY-WF001",
        supplier_id: getSupplier(),
        payment_date: new Date(),
        amount: 3300,
        method: "bank",
        status: "posted",
        created_at: now,
        updated_at: now,
      },
    ]);
    const [paymentRow] = await queryInterface.sequelize.query(
      `SELECT id FROM ap_payments WHERE payment_no = 'PAY-WF001';`
    );
    const paymentId = paymentRow[0].id;

    await queryInterface.bulkInsert("ap_payment_allocations", [
      {
        payment_id: paymentId,
        ap_invoice_id: apInvoiceId,
        applied_amount: 3300,
        created_at: now,
        updated_at: now,
      },
    ]);

    // 4. Stock Move (nhập kho)
    await queryInterface.bulkInsert("stock_moves", [
      {
        move_no: "SM-POWF001",
        move_date: new Date(),
        type: "receipt",
        warehouse_id: getWarehouse("WH-HCM"),
        reference_type: "purchase_order",
        reference_id: poId,
        status: "posted",
        note: "Nhập kho PO-WF001",
        created_at: now,
        updated_at: now,
      },
    ]);
    const [moveRow] = await queryInterface.sequelize.query(
      `SELECT id FROM stock_moves WHERE move_no = 'SM-POWF001';`
    );
    const moveId = moveRow[0].id;

    await queryInterface.bulkInsert("stock_move_lines", [
      {
        move_id: moveId,
        product_id: getProduct("PHN001"),
        quantity: 3,
        uom: "PCS",
        created_at: now,
        updated_at: now,
      },
    ]);

    // 5. GL Entry
    await queryInterface.bulkInsert("gl_entries", [
      {
        journal_id: getJournal("PURCHASE"),
        entry_no: "GL-POWF001",
        entry_date: new Date(),
        reference_type: "ap_invoice",
        reference_id: apInvoiceId,
        memo: "Workflow test mua hàng",
        status: "posted",
        created_at: now,
        updated_at: now,
      },
    ]);
    const [entryRow] = await queryInterface.sequelize.query(
      `SELECT id FROM gl_entries WHERE entry_no = 'GL-POWF001';`
    );
    const entryId = entryRow[0].id;

    await queryInterface.bulkInsert("gl_entry_lines", [
      {
        entry_id: entryId,
        account_id: getAccount("156"), // hàng hóa
        debit: 3000,
        credit: 0,
        created_at: now,
        updated_at: now,
      },
      {
        entry_id: entryId,
        account_id: getAccount("1331"), // Thuế GTGT được khấu trừ (nếu bạn có TK 1331)
        debit: 300,
        credit: 0,
        created_at: now,
        updated_at: now,
      },
      {
        entry_id: entryId,
        account_id: getAccount("331"), // phải trả NCC
        debit: 0,
        credit: 3300,
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("gl_entry_lines", null, {});
    await queryInterface.bulkDelete("gl_entries", null, {});
    await queryInterface.bulkDelete("stock_move_lines", null, {});
    await queryInterface.bulkDelete("stock_moves", null, {});
    await queryInterface.bulkDelete("ap_payment_allocations", null, {});
    await queryInterface.bulkDelete("ap_payments", null, {});
    await queryInterface.bulkDelete("ap_invoice_lines", null, {});
    await queryInterface.bulkDelete("ap_invoices", null, {});
    await queryInterface.bulkDelete("purchase_order_lines", null, {});
    await queryInterface.bulkDelete("purchase_orders", null, {});
  },
};
