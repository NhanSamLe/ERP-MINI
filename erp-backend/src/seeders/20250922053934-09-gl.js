"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    // 1. GL Accounts
    await queryInterface.bulkInsert("gl_accounts", [
      { code: "111", name: "Tiền mặt", type: "asset", normal_side: "debit", created_at: now, updated_at: now },
      { code: "112", name: "Tiền gửi ngân hàng", type: "asset", normal_side: "debit", created_at: now, updated_at: now },
      { code: "131", name: "Phải thu khách hàng", type: "asset", normal_side: "debit", created_at: now, updated_at: now },
       { code: "1331", name: "Thuế GTGT được khấu trừ", type: "asset", normal_side: "debit", created_at: now, updated_at: now }, 
      { code: "331", name: "Phải trả nhà cung cấp", type: "liability", normal_side: "credit", created_at: now, updated_at: now },
      { code: "511", name: "Doanh thu bán hàng", type: "revenue", normal_side: "credit", created_at: now, updated_at: now },
      { code: "632", name: "Giá vốn hàng bán", type: "expense", normal_side: "debit", created_at: now, updated_at: now },
      { code: "156", name: "Hàng hóa", type: "asset", normal_side: "debit", created_at: now, updated_at: now },
      { code: "3331", name: "Thuế GTGT phải nộp", type: "liability", normal_side: "credit", created_at: now, updated_at: now },
    ]);

    const [accounts] = await queryInterface.sequelize.query(`SELECT id, code FROM gl_accounts;`);
    function getAccount(code) {
      const acc = accounts.find((a) => a.code === code);
      if (!acc) throw new Error(`Account ${code} not found!`);
      return acc.id;
    }

    // 2. GL Journals
    await queryInterface.bulkInsert("gl_journals", [
      { code: "SALES", name: "Nhật ký bán hàng", created_at: now, updated_at: now },
      { code: "PURCHASE", name: "Nhật ký mua hàng", created_at: now, updated_at: now },
      { code: "CASH", name: "Nhật ký thu chi tiền mặt", created_at: now, updated_at: now },
      { code: "BANK", name: "Nhật ký ngân hàng", created_at: now, updated_at: now },
    ]);

    const [journals] = await queryInterface.sequelize.query(`SELECT id, code FROM gl_journals;`);
    function getJournal(code) {
      const j = journals.find((j) => j.code === code);
      if (!j) throw new Error(`Journal ${code} not found!`);
      return j.id;
    }

    // Lấy dữ liệu từ AR/AP
    const [invoicesAR] = await queryInterface.sequelize.query(`SELECT id, invoice_no, total_after_tax FROM ar_invoices;`);
    const [invoicesAP] = await queryInterface.sequelize.query(`SELECT id, invoice_no, total_after_tax FROM ap_invoices;`);
    const [receipts] = await queryInterface.sequelize.query(`SELECT id, receipt_no, amount FROM ar_receipts;`);
    const [payments] = await queryInterface.sequelize.query(`SELECT id, payment_no, amount FROM ap_payments;`);

    // 3. GL Entries
    await queryInterface.bulkInsert("gl_entries", [
      {
        journal_id: getJournal("SALES"),
        entry_no: "GL-SO001",
        entry_date: new Date(),
        reference_type: "ar_invoice",
        reference_id: invoicesAR.find((i) => i.invoice_no === "INV001").id,
        memo: "Ghi nhận doanh thu bán hàng SO001",
        status: "posted",
        created_at: now,
        updated_at: now,
      },
      {
        journal_id: getJournal("PURCHASE"),
        entry_no: "GL-PO001",
        entry_date: new Date(),
        reference_type: "ap_invoice",
        reference_id: invoicesAP.find((i) => i.invoice_no === "PINV001").id,
        memo: "Ghi nhận công nợ phải trả PO001",
        status: "posted",
        created_at: now,
        updated_at: now,
      },
      {
        journal_id: getJournal("CASH"),
        entry_no: "GL-RCPT001",
        entry_date: new Date(),
        reference_type: "ar_receipt",
        reference_id: receipts.find((r) => r.receipt_no === "RCPT001").id,
        memo: "Khách hàng thanh toán SO001",
        status: "posted",
        created_at: now,
        updated_at: now,
      },
      {
        journal_id: getJournal("BANK"),
        entry_no: "GL-PAY001",
        entry_date: new Date(),
        reference_type: "ap_payment",
        reference_id: payments.find((p) => p.payment_no === "PAY001").id,
        memo: "Thanh toán nhà cung cấp PO001",
        status: "posted",
        created_at: now,
        updated_at: now,
      },
    ]);

    const [entries] = await queryInterface.sequelize.query(`SELECT id, entry_no FROM gl_entries;`);
    function getEntry(no) {
      const e = entries.find((e) => e.entry_no === no);
      if (!e) throw new Error(`Entry ${no} not found!`);
      return e.id;
    }

    // 4. GL Entry Lines
    await queryInterface.bulkInsert("gl_entry_lines", [
      // Doanh thu bán hàng SO001
      { entry_id: getEntry("GL-SO001"), account_id: getAccount("131"), debit: 1100, credit: 0, created_at: now, updated_at: now },
      { entry_id: getEntry("GL-SO001"), account_id: getAccount("511"), debit: 0, credit: 1000, created_at: now, updated_at: now },
      { entry_id: getEntry("GL-SO001"), account_id: getAccount("3331"), debit: 0, credit: 100, created_at: now, updated_at: now },

      // Công nợ mua hàng PO001
      { entry_id: getEntry("GL-PO001"), account_id: getAccount("156"), debit: 800, credit: 0, created_at: now, updated_at: now },
      { entry_id: getEntry("GL-PO001"), account_id: getAccount("331"), debit: 0, credit: 880, created_at: now, updated_at: now },

      // Thu tiền khách hàng
      { entry_id: getEntry("GL-RCPT001"), account_id: getAccount("111"), debit: 1100, credit: 0, created_at: now, updated_at: now },
      { entry_id: getEntry("GL-RCPT001"), account_id: getAccount("131"), debit: 0, credit: 1100, created_at: now, updated_at: now },

      // Trả tiền NCC
      { entry_id: getEntry("GL-PAY001"), account_id: getAccount("331"), debit: 880, credit: 0, created_at: now, updated_at: now },
      { entry_id: getEntry("GL-PAY001"), account_id: getAccount("112"), debit: 0, credit: 880, created_at: now, updated_at: now },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("gl_entry_lines", null, {});
    await queryInterface.bulkDelete("gl_entries", null, {});
    await queryInterface.bulkDelete("gl_journals", null, {});
    await queryInterface.bulkDelete("gl_accounts", null, {});
  },
};
