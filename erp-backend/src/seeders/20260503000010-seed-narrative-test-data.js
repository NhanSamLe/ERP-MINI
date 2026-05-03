"use strict";

/**
 * Seed test data đầy đủ quan hệ cho AI Narrative
 * Flow: sale_orders → sale_order_lines → ar_invoices → ar_invoice_lines → ar_receipts → ar_receipt_allocations
 *       purchase_orders → purchase_order_lines → ap_invoices → ap_invoice_lines → ap_payments → ap_payment_allocations
 */

const CUSTOMER_ID = 1;
const SUPPLIER_ID = 2;
const SUPPLIER_ID2 = 4;
const USER_ID = 1;
const BRANCH_ID = 1;
// Products thực tế trong DB
const PROD_DELL = 1; // Dell Inspiron 15 - sale 22,990,000 / cost 18,000,000
const PROD_IPHONE = 2; // iPhone 15        - sale 27,990,000 / cost 22,000,000
const PROD_TV = 3; // Samsung TV 55"   - sale 16,990,000 / cost 12,000,000

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // ══════════════════════════════════════════════════════
    // THÁNG 2/2025 — kỳ trước (để AI so sánh)
    // ══════════════════════════════════════════════════════

    // 1. Sale Orders tháng 2
    await queryInterface.bulkInsert("sale_orders", [
      {
        order_no: "SO-NAR-2502-001",
        customer_id: CUSTOMER_ID,
        order_date: new Date("2025-02-10"),
        status: "completed",
        total_before_tax: 45980000, // 2 Dell
        total_tax: 4598000,
        total_after_tax: 50578000,
        created_by: USER_ID,
        created_at: new Date("2025-02-10"),
        updated_at: new Date("2025-02-10"),
      },
      {
        order_no: "SO-NAR-2502-002",
        customer_id: CUSTOMER_ID,
        order_date: new Date("2025-02-20"),
        status: "completed",
        total_before_tax: 55980000, // 2 iPhone
        total_tax: 5598000,
        total_after_tax: 61578000,
        created_by: USER_ID,
        created_at: new Date("2025-02-20"),
        updated_at: new Date("2025-02-20"),
      },
    ]);

    // Lấy ID sale orders vừa tạo
    const [so_feb] = await queryInterface.sequelize.query(
      `SELECT id, order_no FROM sale_orders WHERE order_no LIKE 'SO-NAR-2502-%' ORDER BY id ASC`,
    );

    // 2. Sale Order Lines tháng 2
    await queryInterface.bulkInsert("sale_order_lines", [
      {
        order_id: so_feb[0].id,
        product_id: PROD_DELL,
        description: "Dell Inspiron 15",
        quantity: 2,
        unit_price: 22990000,
        line_total: 45980000,
        line_tax: 4598000,
        line_total_after_tax: 50578000,
        created_at: new Date("2025-02-10"),
        updated_at: new Date("2025-02-10"),
      },
      {
        order_id: so_feb[1].id,
        product_id: PROD_IPHONE,
        description: "iPhone 15",
        quantity: 2,
        unit_price: 27990000,
        line_total: 55980000,
        line_tax: 5598000,
        line_total_after_tax: 61578000,
        created_at: new Date("2025-02-20"),
        updated_at: new Date("2025-02-20"),
      },
    ]);

    // 3. AR Invoices tháng 2 (linked to sale orders)
    await queryInterface.bulkInsert("ar_invoices", [
      {
        order_id: so_feb[0].id,
        invoice_no: "AR-NAR-2502-001",
        invoice_date: new Date("2025-02-10"),
        status: "paid",
        total_before_tax: 45980000,
        total_tax: 4598000,
        total_after_tax: 50578000,
        created_by: USER_ID,
        branch_id: BRANCH_ID,
        created_at: new Date("2025-02-10"),
        updated_at: new Date("2025-02-28"),
      },
      {
        order_id: so_feb[1].id,
        invoice_no: "AR-NAR-2502-002",
        invoice_date: new Date("2025-02-20"),
        status: "paid",
        total_before_tax: 55980000,
        total_tax: 5598000,
        total_after_tax: 61578000,
        created_by: USER_ID,
        branch_id: BRANCH_ID,
        created_at: new Date("2025-02-20"),
        updated_at: new Date("2025-02-28"),
      },
    ]);

    const [ar_feb] = await queryInterface.sequelize.query(
      `SELECT id FROM ar_invoices WHERE invoice_no LIKE 'AR-NAR-2502-%' ORDER BY id ASC`,
    );

    // 4. AR Invoice Lines tháng 2
    await queryInterface.bulkInsert("ar_invoice_lines", [
      {
        invoice_id: ar_feb[0].id,
        product_id: PROD_DELL,
        description: "Dell Inspiron 15",
        quantity: 2,
        unit_price: 22990000,
        line_total: 45980000,
        line_tax: 4598000,
        line_total_after_tax: 50578000,
        created_at: new Date("2025-02-10"),
        updated_at: new Date("2025-02-10"),
      },
      {
        invoice_id: ar_feb[1].id,
        product_id: PROD_IPHONE,
        description: "iPhone 15",
        quantity: 2,
        unit_price: 27990000,
        line_total: 55980000,
        line_tax: 5598000,
        line_total_after_tax: 61578000,
        created_at: new Date("2025-02-20"),
        updated_at: new Date("2025-02-20"),
      },
    ]);

    // 5. AR Receipts tháng 2 (thanh toán đầy đủ)
    await queryInterface.bulkInsert("ar_receipts", [
      {
        receipt_no: "REC-NAR-2502-001",
        customer_id: CUSTOMER_ID,
        receipt_date: new Date("2025-02-28"),
        amount: 112156000, // tổng 2 invoice
        method: "bank",
        status: "posted",
        allocation_status: "fully_allocated",
        created_by: USER_ID,
        branch_id: BRANCH_ID,
        created_at: new Date("2025-02-28"),
        updated_at: new Date("2025-02-28"),
      },
    ]);

    const [rec_feb] = await queryInterface.sequelize.query(
      `SELECT id FROM ar_receipts WHERE receipt_no LIKE 'REC-NAR-2502-%' ORDER BY id ASC`,
    );

    // 6. AR Receipt Allocations tháng 2
    await queryInterface.bulkInsert("ar_receipt_allocations", [
      {
        receipt_id: rec_feb[0].id,
        invoice_id: ar_feb[0].id,
        applied_amount: 50578000,
        created_at: new Date("2025-02-28"),
        updated_at: new Date("2025-02-28"),
      },
      {
        receipt_id: rec_feb[0].id,
        invoice_id: ar_feb[1].id,
        applied_amount: 61578000,
        created_at: new Date("2025-02-28"),
        updated_at: new Date("2025-02-28"),
      },
    ]);

    // ══════════════════════════════════════════════════════
    // THÁNG 3/2025 — kỳ hiện tại (tăng trưởng ~40%)
    // ══════════════════════════════════════════════════════

    // 7. Sale Orders tháng 3
    await queryInterface.bulkInsert("sale_orders", [
      {
        order_no: "SO-NAR-2503-001",
        customer_id: CUSTOMER_ID,
        order_date: new Date("2025-03-05"),
        status: "completed",
        total_before_tax: 83970000, // 3 Dell + 1 iPhone
        total_tax: 8397000,
        total_after_tax: 92367000,
        created_by: USER_ID,
        created_at: new Date("2025-03-05"),
        updated_at: new Date("2025-03-05"),
      },
      {
        order_no: "SO-NAR-2503-002",
        customer_id: CUSTOMER_ID,
        order_date: new Date("2025-03-15"),
        status: "completed",
        total_before_tax: 55980000, // 2 iPhone
        total_tax: 5598000,
        total_after_tax: 61578000,
        created_by: USER_ID,
        created_at: new Date("2025-03-15"),
        updated_at: new Date("2025-03-15"),
      },
      {
        order_no: "SO-NAR-2503-003",
        customer_id: CUSTOMER_ID,
        order_date: new Date("2025-03-25"),
        status: "completed",
        total_before_tax: 50970000, // 3 Samsung TV
        total_tax: 5097000,
        total_after_tax: 56067000,
        created_by: USER_ID,
        created_at: new Date("2025-03-25"),
        updated_at: new Date("2025-03-25"),
      },
    ]);

    const [so_mar] = await queryInterface.sequelize.query(
      `SELECT id, order_no FROM sale_orders WHERE order_no LIKE 'SO-NAR-2503-%' ORDER BY id ASC`,
    );

    // 8. Sale Order Lines tháng 3
    await queryInterface.bulkInsert("sale_order_lines", [
      // SO-001: 3 Dell + 1 iPhone
      {
        order_id: so_mar[0].id,
        product_id: PROD_DELL,
        description: "Dell Inspiron 15",
        quantity: 3,
        unit_price: 22990000,
        line_total: 68970000,
        line_tax: 6897000,
        line_total_after_tax: 75867000,
        created_at: new Date("2025-03-05"),
        updated_at: new Date("2025-03-05"),
      },
      {
        order_id: so_mar[0].id,
        product_id: PROD_IPHONE,
        description: "iPhone 15",
        quantity: 1,
        unit_price: 27990000,
        line_total: 27990000,
        line_tax: 2799000,
        line_total_after_tax: 30789000,
        created_at: new Date("2025-03-05"),
        updated_at: new Date("2025-03-05"),
      },
      // SO-002: 2 iPhone
      {
        order_id: so_mar[1].id,
        product_id: PROD_IPHONE,
        description: "iPhone 15",
        quantity: 2,
        unit_price: 27990000,
        line_total: 55980000,
        line_tax: 5598000,
        line_total_after_tax: 61578000,
        created_at: new Date("2025-03-15"),
        updated_at: new Date("2025-03-15"),
      },
      // SO-003: 3 Samsung TV
      {
        order_id: so_mar[2].id,
        product_id: PROD_TV,
        description: "Samsung Smart TV 55 inch",
        quantity: 3,
        unit_price: 16990000,
        line_total: 50970000,
        line_tax: 5097000,
        line_total_after_tax: 56067000,
        created_at: new Date("2025-03-25"),
        updated_at: new Date("2025-03-25"),
      },
    ]);

    // 9. AR Invoices tháng 3
    await queryInterface.bulkInsert("ar_invoices", [
      // Đã thanh toán
      {
        order_id: so_mar[0].id,
        invoice_no: "AR-NAR-2503-001",
        invoice_date: new Date("2025-03-05"),
        status: "paid",
        total_before_tax: 83970000,
        total_tax: 8397000,
        total_after_tax: 92367000,
        created_by: USER_ID,
        branch_id: BRANCH_ID,
        created_at: new Date("2025-03-05"),
        updated_at: new Date("2025-03-20"),
      },
      // Còn outstanding — chưa thu được (DSO cao)
      {
        order_id: so_mar[1].id,
        invoice_no: "AR-NAR-2503-002",
        invoice_date: new Date("2025-03-15"),
        status: "posted",
        total_before_tax: 55980000,
        total_tax: 5598000,
        total_after_tax: 61578000,
        created_by: USER_ID,
        branch_id: BRANCH_ID,
        created_at: new Date("2025-03-15"),
        updated_at: new Date("2025-03-15"),
      },
      {
        order_id: so_mar[2].id,
        invoice_no: "AR-NAR-2503-003",
        invoice_date: new Date("2025-03-25"),
        status: "posted",
        total_before_tax: 50970000,
        total_tax: 5097000,
        total_after_tax: 56067000,
        created_by: USER_ID,
        branch_id: BRANCH_ID,
        created_at: new Date("2025-03-25"),
        updated_at: new Date("2025-03-25"),
      },
    ]);

    const [ar_mar] = await queryInterface.sequelize.query(
      `SELECT id FROM ar_invoices WHERE invoice_no LIKE 'AR-NAR-2503-%' ORDER BY id ASC`,
    );

    // 10. AR Invoice Lines tháng 3
    await queryInterface.bulkInsert("ar_invoice_lines", [
      {
        invoice_id: ar_mar[0].id,
        product_id: PROD_DELL,
        description: "Dell Inspiron 15",
        quantity: 3,
        unit_price: 22990000,
        line_total: 68970000,
        line_tax: 6897000,
        line_total_after_tax: 75867000,
        created_at: new Date("2025-03-05"),
        updated_at: new Date("2025-03-05"),
      },
      {
        invoice_id: ar_mar[0].id,
        product_id: PROD_IPHONE,
        description: "iPhone 15",
        quantity: 1,
        unit_price: 27990000,
        line_total: 27990000,
        line_tax: 2799000,
        line_total_after_tax: 30789000,
        created_at: new Date("2025-03-05"),
        updated_at: new Date("2025-03-05"),
      },
      {
        invoice_id: ar_mar[1].id,
        product_id: PROD_IPHONE,
        description: "iPhone 15",
        quantity: 2,
        unit_price: 27990000,
        line_total: 55980000,
        line_tax: 5598000,
        line_total_after_tax: 61578000,
        created_at: new Date("2025-03-15"),
        updated_at: new Date("2025-03-15"),
      },
      {
        invoice_id: ar_mar[2].id,
        product_id: PROD_TV,
        description: "Samsung Smart TV 55 inch",
        quantity: 3,
        unit_price: 16990000,
        line_total: 50970000,
        line_tax: 5097000,
        line_total_after_tax: 56067000,
        created_at: new Date("2025-03-25"),
        updated_at: new Date("2025-03-25"),
      },
    ]);

    // 11. AR Receipt tháng 3 — chỉ thu được invoice đầu
    await queryInterface.bulkInsert("ar_receipts", [
      {
        receipt_no: "REC-NAR-2503-001",
        customer_id: CUSTOMER_ID,
        receipt_date: new Date("2025-03-20"),
        amount: 92367000,
        method: "bank",
        status: "posted",
        allocation_status: "fully_allocated",
        created_by: USER_ID,
        branch_id: BRANCH_ID,
        created_at: new Date("2025-03-20"),
        updated_at: new Date("2025-03-20"),
      },
    ]);

    const [rec_mar] = await queryInterface.sequelize.query(
      `SELECT id FROM ar_receipts WHERE receipt_no LIKE 'REC-NAR-2503-%' ORDER BY id ASC`,
    );

    await queryInterface.bulkInsert("ar_receipt_allocations", [
      {
        receipt_id: rec_mar[0].id,
        invoice_id: ar_mar[0].id,
        applied_amount: 92367000,
        created_at: new Date("2025-03-20"),
        updated_at: new Date("2025-03-20"),
      },
    ]);

    // ══════════════════════════════════════════════════════
    // PURCHASE — tháng 2 & 3/2025
    // ══════════════════════════════════════════════════════

    // 12. Purchase Orders tháng 2
    await queryInterface.bulkInsert("purchase_orders", [
      {
        po_no: "PO-NAR-2502-001",
        supplier_id: SUPPLIER_ID,
        order_date: new Date("2025-02-08"),
        status: "completed",
        total_before_tax: 36000000, // 2 Dell cost
        total_tax: 3600000,
        total_after_tax: 39600000,
        created_by: USER_ID,
        created_at: new Date("2025-02-08"),
        updated_at: new Date("2025-02-08"),
      },
      {
        po_no: "PO-NAR-2502-002",
        supplier_id: SUPPLIER_ID2,
        order_date: new Date("2025-02-18"),
        status: "completed",
        total_before_tax: 44000000, // 2 iPhone cost
        total_tax: 4400000,
        total_after_tax: 48400000,
        created_by: USER_ID,
        created_at: new Date("2025-02-18"),
        updated_at: new Date("2025-02-18"),
      },
    ]);

    const [po_feb] = await queryInterface.sequelize.query(
      `SELECT id FROM purchase_orders WHERE po_no LIKE 'PO-NAR-2502-%' ORDER BY id ASC`,
    );

    // 13. Purchase Order Lines tháng 2
    await queryInterface.bulkInsert("purchase_order_lines", [
      {
        po_id: po_feb[0].id,
        product_id: PROD_DELL,
        quantity: 2,
        unit_price: 18000000,
        line_total: 36000000,
        line_tax: 3600000,
        line_total_after_tax: 39600000,
        created_at: new Date("2025-02-08"),
        updated_at: new Date("2025-02-08"),
      },
      {
        po_id: po_feb[1].id,
        product_id: PROD_IPHONE,
        quantity: 2,
        unit_price: 22000000,
        line_total: 44000000,
        line_tax: 4400000,
        line_total_after_tax: 48400000,
        created_at: new Date("2025-02-18"),
        updated_at: new Date("2025-02-18"),
      },
    ]);

    // 14. AP Invoices tháng 2 (linked to PO)
    await queryInterface.bulkInsert("ap_invoices", [
      {
        po_id: po_feb[0].id,
        supplier_id: SUPPLIER_ID,
        invoice_no: "AP-NAR-2502-001",
        invoice_date: new Date("2025-02-08"),
        due_date: new Date("2025-03-08"),
        status: "paid",
        total_before_tax: 36000000,
        total_tax: 3600000,
        total_after_tax: 39600000,
        created_by: USER_ID,
        branch_id: BRANCH_ID,
        created_at: new Date("2025-02-08"),
        updated_at: new Date("2025-02-28"),
      },
      {
        po_id: po_feb[1].id,
        supplier_id: SUPPLIER_ID2,
        invoice_no: "AP-NAR-2502-002",
        invoice_date: new Date("2025-02-18"),
        due_date: new Date("2025-03-18"),
        status: "paid",
        total_before_tax: 44000000,
        total_tax: 4400000,
        total_after_tax: 48400000,
        created_by: USER_ID,
        branch_id: BRANCH_ID,
        created_at: new Date("2025-02-18"),
        updated_at: new Date("2025-02-28"),
      },
    ]);

    const [ap_feb] = await queryInterface.sequelize.query(
      `SELECT id FROM ap_invoices WHERE invoice_no LIKE 'AP-NAR-2502-%' ORDER BY id ASC`,
    );

    // 15. AP Invoice Lines tháng 2
    await queryInterface.bulkInsert("ap_invoice_lines", [
      {
        ap_invoice_id: ap_feb[0].id,
        product_id: PROD_DELL,
        quantity: 2,
        unit_price: 18000000,
        line_total: 36000000,
        line_tax: 3600000,
        line_total_after_tax: 39600000,
        created_at: new Date("2025-02-08"),
        updated_at: new Date("2025-02-08"),
      },
      {
        ap_invoice_id: ap_feb[1].id,
        product_id: PROD_IPHONE,
        quantity: 2,
        unit_price: 22000000,
        line_total: 44000000,
        line_tax: 4400000,
        line_total_after_tax: 48400000,
        created_at: new Date("2025-02-18"),
        updated_at: new Date("2025-02-18"),
      },
    ]);

    // 16. AP Payments tháng 2
    await queryInterface.bulkInsert("ap_payments", [
      {
        payment_no: "PAY-NAR-2502-001",
        supplier_id: SUPPLIER_ID,
        payment_date: new Date("2025-02-28"),
        amount: 88000000, // tổng 2 AP invoice
        method: "bank",
        status: "completed",
        created_by: USER_ID,
        branch_id: BRANCH_ID,
        created_at: new Date("2025-02-28"),
        updated_at: new Date("2025-02-28"),
      },
    ]);

    const [pay_feb] = await queryInterface.sequelize.query(
      `SELECT id FROM ap_payments WHERE payment_no LIKE 'PAY-NAR-2502-%' ORDER BY id ASC`,
    );

    await queryInterface.bulkInsert("ap_payment_allocations", [
      {
        payment_id: pay_feb[0].id,
        ap_invoice_id: ap_feb[0].id,
        applied_amount: 39600000,
        created_at: new Date("2025-02-28"),
        updated_at: new Date("2025-02-28"),
      },
      {
        payment_id: pay_feb[0].id,
        ap_invoice_id: ap_feb[1].id,
        applied_amount: 48400000,
        created_at: new Date("2025-02-28"),
        updated_at: new Date("2025-02-28"),
      },
    ]);

    // 17. Purchase Orders tháng 3
    await queryInterface.bulkInsert("purchase_orders", [
      {
        po_no: "PO-NAR-2503-001",
        supplier_id: SUPPLIER_ID,
        order_date: new Date("2025-03-03"),
        status: "completed",
        total_before_tax: 54000000, // 3 Dell cost
        total_tax: 5400000,
        total_after_tax: 59400000,
        created_by: USER_ID,
        created_at: new Date("2025-03-03"),
        updated_at: new Date("2025-03-03"),
      },
      {
        po_no: "PO-NAR-2503-002",
        supplier_id: SUPPLIER_ID2,
        order_date: new Date("2025-03-10"),
        status: "completed",
        total_before_tax: 66000000, // 3 iPhone cost
        total_tax: 6600000,
        total_after_tax: 72600000,
        created_by: USER_ID,
        created_at: new Date("2025-03-10"),
        updated_at: new Date("2025-03-10"),
      },
      {
        po_no: "PO-NAR-2503-003",
        supplier_id: SUPPLIER_ID,
        order_date: new Date("2025-03-20"),
        status: "completed",
        total_before_tax: 36000000, // 3 TV cost
        total_tax: 3600000,
        total_after_tax: 39600000,
        created_by: USER_ID,
        created_at: new Date("2025-03-20"),
        updated_at: new Date("2025-03-20"),
      },
    ]);

    const [po_mar] = await queryInterface.sequelize.query(
      `SELECT id FROM purchase_orders WHERE po_no LIKE 'PO-NAR-2503-%' ORDER BY id ASC`,
    );

    // 18. Purchase Order Lines tháng 3
    await queryInterface.bulkInsert("purchase_order_lines", [
      {
        po_id: po_mar[0].id,
        product_id: PROD_DELL,
        quantity: 3,
        unit_price: 18000000,
        line_total: 54000000,
        line_tax: 5400000,
        line_total_after_tax: 59400000,
        created_at: new Date("2025-03-03"),
        updated_at: new Date("2025-03-03"),
      },
      {
        po_id: po_mar[1].id,
        product_id: PROD_IPHONE,
        quantity: 3,
        unit_price: 22000000,
        line_total: 66000000,
        line_tax: 6600000,
        line_total_after_tax: 72600000,
        created_at: new Date("2025-03-10"),
        updated_at: new Date("2025-03-10"),
      },
      {
        po_id: po_mar[2].id,
        product_id: PROD_TV,
        quantity: 3,
        unit_price: 12000000,
        line_total: 36000000,
        line_tax: 3600000,
        line_total_after_tax: 39600000,
        created_at: new Date("2025-03-20"),
        updated_at: new Date("2025-03-20"),
      },
    ]);

    // 19. AP Invoices tháng 3
    await queryInterface.bulkInsert("ap_invoices", [
      // Đã thanh toán
      {
        po_id: po_mar[0].id,
        supplier_id: SUPPLIER_ID,
        invoice_no: "AP-NAR-2503-001",
        invoice_date: new Date("2025-03-03"),
        due_date: new Date("2025-04-03"),
        status: "paid",
        total_before_tax: 54000000,
        total_tax: 5400000,
        total_after_tax: 59400000,
        created_by: USER_ID,
        branch_id: BRANCH_ID,
        created_at: new Date("2025-03-03"),
        updated_at: new Date("2025-03-25"),
      },
      // Còn outstanding — chưa trả (DPO cao)
      {
        po_id: po_mar[1].id,
        supplier_id: SUPPLIER_ID2,
        invoice_no: "AP-NAR-2503-002",
        invoice_date: new Date("2025-03-10"),
        due_date: new Date("2025-04-10"),
        status: "posted",
        total_before_tax: 66000000,
        total_tax: 6600000,
        total_after_tax: 72600000,
        created_by: USER_ID,
        branch_id: BRANCH_ID,
        created_at: new Date("2025-03-10"),
        updated_at: new Date("2025-03-10"),
      },
      {
        po_id: po_mar[2].id,
        supplier_id: SUPPLIER_ID,
        invoice_no: "AP-NAR-2503-003",
        invoice_date: new Date("2025-03-20"),
        due_date: new Date("2025-04-20"),
        status: "posted",
        total_before_tax: 36000000,
        total_tax: 3600000,
        total_after_tax: 39600000,
        created_by: USER_ID,
        branch_id: BRANCH_ID,
        created_at: new Date("2025-03-20"),
        updated_at: new Date("2025-03-20"),
      },
    ]);

    const [ap_mar] = await queryInterface.sequelize.query(
      `SELECT id FROM ap_invoices WHERE invoice_no LIKE 'AP-NAR-2503-%' ORDER BY id ASC`,
    );

    // 20. AP Invoice Lines tháng 3
    await queryInterface.bulkInsert("ap_invoice_lines", [
      {
        ap_invoice_id: ap_mar[0].id,
        product_id: PROD_DELL,
        quantity: 3,
        unit_price: 18000000,
        line_total: 54000000,
        line_tax: 5400000,
        line_total_after_tax: 59400000,
        created_at: new Date("2025-03-03"),
        updated_at: new Date("2025-03-03"),
      },
      {
        ap_invoice_id: ap_mar[1].id,
        product_id: PROD_IPHONE,
        quantity: 3,
        unit_price: 22000000,
        line_total: 66000000,
        line_tax: 6600000,
        line_total_after_tax: 72600000,
        created_at: new Date("2025-03-10"),
        updated_at: new Date("2025-03-10"),
      },
      {
        ap_invoice_id: ap_mar[2].id,
        product_id: PROD_TV,
        quantity: 3,
        unit_price: 12000000,
        line_total: 36000000,
        line_tax: 3600000,
        line_total_after_tax: 39600000,
        created_at: new Date("2025-03-20"),
        updated_at: new Date("2025-03-20"),
      },
    ]);

    // 21. AP Payment tháng 3 — chỉ trả invoice đầu
    await queryInterface.bulkInsert("ap_payments", [
      {
        payment_no: "PAY-NAR-2503-001",
        supplier_id: SUPPLIER_ID,
        payment_date: new Date("2025-03-25"),
        amount: 59400000,
        method: "bank",
        status: "completed",
        created_by: USER_ID,
        branch_id: BRANCH_ID,
        created_at: new Date("2025-03-25"),
        updated_at: new Date("2025-03-25"),
      },
    ]);

    const [pay_mar] = await queryInterface.sequelize.query(
      `SELECT id FROM ap_payments WHERE payment_no LIKE 'PAY-NAR-2503-%' ORDER BY id ASC`,
    );

    await queryInterface.bulkInsert("ap_payment_allocations", [
      {
        payment_id: pay_mar[0].id,
        ap_invoice_id: ap_mar[0].id,
        applied_amount: 59400000,
        created_at: new Date("2025-03-25"),
        updated_at: new Date("2025-03-25"),
      },
    ]);

    console.log("✅ Narrative test data seeded successfully!");
    console.log(
      "   Feb 2025: 2 SO → 2 AR inv (paid) → 1 receipt fully allocated",
    );
    console.log(
      "             2 PO → 2 AP inv (paid) → 1 payment fully allocated",
    );
    console.log("   Mar 2025: 3 SO → 3 AR inv (1 paid, 2 outstanding)");
    console.log("             3 PO → 3 AP inv (1 paid, 2 outstanding)");
    console.log('   Products: Dell Inspiron 15, iPhone 15, Samsung TV 55"');
  },

  down: async (queryInterface, Sequelize) => {
    const Op = Sequelize.Op;

    // Xóa theo thứ tự ngược lại để tránh FK constraint
    await queryInterface.bulkDelete("ap_payment_allocations", {
      payment_id: {
        [Op.in]: queryInterface.sequelize.literal(
          `(SELECT id FROM ap_payments WHERE payment_no LIKE 'PAY-NAR-%')`,
        ),
      },
    });
    await queryInterface.bulkDelete("ap_payments", {
      payment_no: { [Op.like]: "PAY-NAR-%" },
    });
    await queryInterface.bulkDelete("ap_invoice_lines", {
      ap_invoice_id: {
        [Op.in]: queryInterface.sequelize.literal(
          `(SELECT id FROM ap_invoices WHERE invoice_no LIKE 'AP-NAR-%')`,
        ),
      },
    });
    await queryInterface.bulkDelete("ap_invoices", {
      invoice_no: { [Op.like]: "AP-NAR-%" },
    });
    await queryInterface.bulkDelete("purchase_order_lines", {
      po_id: {
        [Op.in]: queryInterface.sequelize.literal(
          `(SELECT id FROM purchase_orders WHERE po_no LIKE 'PO-NAR-%')`,
        ),
      },
    });
    await queryInterface.bulkDelete("purchase_orders", {
      po_no: { [Op.like]: "PO-NAR-%" },
    });
    await queryInterface.bulkDelete("ar_receipt_allocations", {
      receipt_id: {
        [Op.in]: queryInterface.sequelize.literal(
          `(SELECT id FROM ar_receipts WHERE receipt_no LIKE 'REC-NAR-%')`,
        ),
      },
    });
    await queryInterface.bulkDelete("ar_receipts", {
      receipt_no: { [Op.like]: "REC-NAR-%" },
    });
    await queryInterface.bulkDelete("ar_invoice_lines", {
      invoice_id: {
        [Op.in]: queryInterface.sequelize.literal(
          `(SELECT id FROM ar_invoices WHERE invoice_no LIKE 'AR-NAR-%')`,
        ),
      },
    });
    await queryInterface.bulkDelete("ar_invoices", {
      invoice_no: { [Op.like]: "AR-NAR-%" },
    });
    await queryInterface.bulkDelete("sale_order_lines", {
      order_id: {
        [Op.in]: queryInterface.sequelize.literal(
          `(SELECT id FROM sale_orders WHERE order_no LIKE 'SO-NAR-%')`,
        ),
      },
    });
    await queryInterface.bulkDelete("sale_orders", {
      order_no: { [Op.like]: "SO-NAR-%" },
    });
  },
};
