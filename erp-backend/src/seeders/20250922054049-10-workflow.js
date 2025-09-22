"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    // Lấy dữ liệu tham chiếu
    const [partners] = await queryInterface.sequelize.query(`SELECT id, type FROM partners;`);
    const [users] = await queryInterface.sequelize.query(`SELECT id, username FROM users;`);
    const [products] = await queryInterface.sequelize.query(`SELECT id, sku FROM products;`);
    const [branches] = await queryInterface.sequelize.query(`SELECT id FROM branches;`);
    const [warehouses] = await queryInterface.sequelize.query(`SELECT id, code FROM warehouses;`);
    const [taxRates] = await queryInterface.sequelize.query(`SELECT id, code FROM tax_rates;`);
    const [journals] = await queryInterface.sequelize.query(`SELECT id, code FROM gl_journals;`);
    const [accounts] = await queryInterface.sequelize.query(`SELECT id, code FROM gl_accounts;`);

    function getCustomer() {
      return partners.find((p) => p.type === "customer").id;
    }
    function getUser(username) {
      return users.find((u) => u.username === username).id;
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

    // 1. Lead + Opportunity
    await queryInterface.bulkInsert("crm_leads", [
      {
        name: "Lead Workflow Test",
        email: "workflow@example.com",
        phone: "0909000111",
        source: "Website",
        assigned_to: getUser("sales01"),
        stage: "qualified",
        created_at: now,
        updated_at: now,
      },
    ]);
    const [leadRow] = await queryInterface.sequelize.query(
      `SELECT id FROM crm_leads WHERE email = 'workflow@example.com';`
    );
    const leadId = leadRow[0].id;

    await queryInterface.bulkInsert("crm_opportunities", [
      {
        lead_id: leadId,
        customer_id: getCustomer(),
        name: "Workflow Laptop Deal",
        stage: "won",
        expected_value: 2000,
        probability: 1,
        owner_id: getUser("sales01"),
        created_at: now,
        updated_at: now,
      },
    ]);
    const [oppRow] = await queryInterface.sequelize.query(
      `SELECT id FROM crm_opportunities WHERE name = 'Workflow Laptop Deal';`
    );
    const oppId = oppRow[0].id;

    // 2. Sale Order
    await queryInterface.bulkInsert("sale_orders", [
      {
        branch_id: branchId,
        order_no: "SO-WF001",
        customer_id: getCustomer(),
        order_date: new Date(),
        status: "confirmed",
        total_before_tax: 2000,
        total_tax: 200,
        total_after_tax: 2200,
        created_at: now,
        updated_at: now,
      },
    ]);
    const [soRow] = await queryInterface.sequelize.query(
      `SELECT id FROM sale_orders WHERE order_no = 'SO-WF001';`
    );
    const soId = soRow[0].id;

    await queryInterface.bulkInsert("sale_order_lines", [
      {
        order_id: soId,
        product_id: getProduct("LAP001"),
        description: "Dell Inspiron 15",
        quantity: 4,
        unit_price: 500,
        tax_rate_id: getTax("VAT10"),
        line_total: 2000,
        created_at: now,
        updated_at: now,
      },
    ]);

    // 3. AR Invoice
    await queryInterface.bulkInsert("ar_invoices", [
      {
        order_id: soId,
        invoice_no: "INV-WF001",
        invoice_date: new Date(),
        total_before_tax: 2000,
        total_tax: 200,
        total_after_tax: 2200,
        status: "posted",
        created_at: now,
        updated_at: now,
      },
    ]);
    const [invoiceRow] = await queryInterface.sequelize.query(
      `SELECT id FROM ar_invoices WHERE invoice_no = 'INV-WF001';`
    );
    const invoiceId = invoiceRow[0].id;

    await queryInterface.bulkInsert("ar_invoice_lines", [
      {
        invoice_id: invoiceId,
        product_id: getProduct("LAP001"),
        description: "Dell Inspiron 15",
        quantity: 4,
        unit_price: 500,
        tax_rate_id: getTax("VAT10"),
        line_total: 2000,
        created_at: now,
        updated_at: now,
      },
    ]);

    // 4. AR Receipt
    await queryInterface.bulkInsert("ar_receipts", [
      {
        receipt_no: "RCPT-WF001",
        customer_id: getCustomer(),
        receipt_date: new Date(),
        amount: 2200,
        method: "bank",
        status: "posted",
        created_at: now,
        updated_at: now,
      },
    ]);
    const [receiptRow] = await queryInterface.sequelize.query(
      `SELECT id FROM ar_receipts WHERE receipt_no = 'RCPT-WF001';`
    );
    const receiptId = receiptRow[0].id;

    await queryInterface.bulkInsert("ar_receipt_allocations", [
      {
        receipt_id: receiptId,
        invoice_id: invoiceId,
        applied_amount: 2200,
        created_at: now,
        updated_at: now,
      },
    ]);

    // 5. Stock Move (xuất kho)
    await queryInterface.bulkInsert("stock_moves", [
      {
        move_no: "SM-WF001",
        move_date: new Date(),
        type: "issue",
        warehouse_id: getWarehouse("WH-HCM"),
        reference_type: "sale_order",
        reference_id: soId,
        status: "posted",
        note: "Xuất kho cho SO-WF001",
        created_at: now,
        updated_at: now,
      },
    ]);
    const [moveRow] = await queryInterface.sequelize.query(
      `SELECT id FROM stock_moves WHERE move_no = 'SM-WF001';`
    );
    const moveId = moveRow[0].id;

    await queryInterface.bulkInsert("stock_move_lines", [
      {
        move_id: moveId,
        product_id: getProduct("LAP001"),
        quantity: 4,
        uom: "PCS",
        created_at: now,
        updated_at: now,
      },
    ]);

    // 6. GL Entry
    await queryInterface.bulkInsert("gl_entries", [
      {
        journal_id: getJournal("SALES"),
        entry_no: "GL-WF001",
        entry_date: new Date(),
        reference_type: "ar_invoice",
        reference_id: invoiceId,
        memo: "Workflow test bán hàng",
        status: "posted",
        created_at: now,
        updated_at: now,
      },
    ]);
    const [entryRow] = await queryInterface.sequelize.query(
      `SELECT id FROM gl_entries WHERE entry_no = 'GL-WF001';`
    );
    const entryId = entryRow[0].id;

    await queryInterface.bulkInsert("gl_entry_lines", [
      {
        entry_id: entryId,
        account_id: getAccount("131"),
        debit: 2200,
        credit: 0,
        created_at: now,
        updated_at: now,
      },
      {
        entry_id: entryId,
        account_id: getAccount("511"),
        debit: 0,
        credit: 2000,
        created_at: now,
        updated_at: now,
      },
      {
        entry_id: entryId,
        account_id: getAccount("3331"), // Thuế GTGT phải nộp
        debit: 0,
        credit: 200,
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
    await queryInterface.bulkDelete("ar_receipt_allocations", null, {});
    await queryInterface.bulkDelete("ar_receipts", null, {});
    await queryInterface.bulkDelete("ar_invoice_lines", null, {});
    await queryInterface.bulkDelete("ar_invoices", null, {});
    await queryInterface.bulkDelete("sale_order_lines", null, {});
    await queryInterface.bulkDelete("sale_orders", null, {});
    await queryInterface.bulkDelete("crm_opportunities", null, {});
    await queryInterface.bulkDelete("crm_leads", null, {});
  },
};
