"use strict";

/**
 * Seeder: OCR Demo Data
 *
 * Tạo dữ liệu mẫu để demo luồng OCR Invoice:
 *  - Partner: Công Ty TNHH Nước Giải Khát Lavie Việt Nam (MST: 0301234567)
 *  - Products: Lavie 500ml, Lavie 1.5L, Lavie Sparkling 330ml
 *  - PO confirmed: PO-2024-0123 (10 thùng Lavie 500ml, 5 thùng 1.5L, 8 thùng Sparkling)
 *  - GRN posted: nhập kho đủ số lượng PO
 *
 * Dùng cho: TC-01 Happy Path — OCR hóa đơn Lavie → tạo tự động
 */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    // ── Lấy dữ liệu tham chiếu ──────────────────────────────────────
    const [branches] = await queryInterface.sequelize.query(
      `SELECT id FROM branches LIMIT 1;`,
    );
    const branchId = branches[0].id;

    const [taxRates] = await queryInterface.sequelize.query(
      `SELECT id, code FROM tax_rates;`,
    );
    const vat10 = taxRates.find((t) => t.code === "VAT10").id;

    const [uoms] = await queryInterface.sequelize.query(
      `SELECT id, code FROM uoms;`,
    );
    // Dùng UOM đầu tiên có sẵn (PCS hoặc bất kỳ)
    const defaultUomId = uoms[0]?.id ?? null;

    const [users] = await queryInterface.sequelize.query(
      `SELECT id FROM users LIMIT 1;`,
    );
    const userId = users[0].id;

    const [warehouses] = await queryInterface.sequelize.query(
      `SELECT id FROM warehouses WHERE branch_id = ${branchId} LIMIT 1;`,
    );
    const warehouseId = warehouses[0]?.id ?? null;

    // ── 1. Partner: Lavie ────────────────────────────────────────────
    await queryInterface.bulkInsert("partners", [
      {
        type: "supplier",
        name: "Công Ty TNHH Nước Giải Khát Lavie Việt Nam",
        contact_person: "Trần Văn Minh",
        phone: "028-3456-7890",
        email: "billing@lavie.com.vn",
        tax_code: "0301234567",
        cccd: null,
        address: "123 Đường Nguyễn Văn Linh, Q.7, TP.HCM",
        province: "TP.HCM",
        district: "Quận 7",
        ward: "Phường Tân Phú",
        bank_account: "1234567890",
        bank_name: "Vietcombank",
        status: "active",
        created_at: now,
        updated_at: now,
      },
    ]);

    const [partners] = await queryInterface.sequelize.query(
      `SELECT id FROM partners WHERE tax_code = '0301234567' LIMIT 1;`,
    );
    const laviePartnerId = partners[0].id;

    // ── 2. Products: Lavie ───────────────────────────────────────────
    const [categories] = await queryInterface.sequelize.query(
      `SELECT id FROM product_categories LIMIT 1;`,
    );
    const categoryId = categories[0]?.id ?? null;

    await queryInterface.bulkInsert("products", [
      {
        category_id: categoryId,
        sku: "LAV500",
        name: "Nước suối Lavie 500ml",
        barcode: "8934588010019",
        uom_id: defaultUomId,
        origin: "Việt Nam",
        cost_price: 7000,
        sale_price: 10000,
        tax_rate_id: vat10,
        status: "active",
        product_type: "storable",
        source_type: "purchased",
        created_at: now,
        updated_at: now,
      },
      {
        category_id: categoryId,
        sku: "LAV1500",
        name: "Nước suối Lavie 1.5L",
        barcode: "8934588010026",
        uom_id: defaultUomId,
        origin: "Việt Nam",
        cost_price: 12000,
        sale_price: 16000,
        tax_rate_id: vat10,
        status: "active",
        product_type: "storable",
        source_type: "purchased",
        created_at: now,
        updated_at: now,
      },
      {
        category_id: categoryId,
        sku: "LAVSP330",
        name: "Nước khoáng Lavie Sparkling 330ml",
        barcode: "8934588010033",
        uom_id: defaultUomId,
        origin: "Việt Nam",
        cost_price: 9000,
        sale_price: 13000,
        tax_rate_id: vat10,
        status: "active",
        product_type: "storable",
        source_type: "purchased",
        created_at: now,
        updated_at: now,
      },
    ]);

    const [products] = await queryInterface.sequelize.query(
      `SELECT id, sku FROM products WHERE sku IN ('LAV500','LAV1500','LAVSP330');`,
    );
    const getProduct = (sku) => products.find((p) => p.sku === sku).id;

    // ── 3. Purchase Order: PO-2024-0123 ─────────────────────────────
    await queryInterface.bulkInsert("purchase_orders", [
      {
        branch_id: branchId,
        po_no: "PO-2024-0123",
        supplier_id: laviePartnerId,
        order_date: new Date("2024-03-10"),
        total_before_tax: 4290000,
        total_tax: 429000,
        total_after_tax: 4719000,
        status: "confirmed",
        created_by: userId,
        approved_by: userId,
        approved_at: new Date("2024-03-11"),
        description: "Đơn mua nước suối Lavie tháng 3/2024 — Demo OCR TC-01",
        created_at: now,
        updated_at: now,
      },
    ]);

    const [pos] = await queryInterface.sequelize.query(
      `SELECT id FROM purchase_orders WHERE po_no = 'PO-2024-0123' LIMIT 1;`,
    );
    const poId = pos[0].id;

    // ── 4. PO Lines ──────────────────────────────────────────────────
    await queryInterface.bulkInsert("purchase_order_lines", [
      {
        po_id: poId,
        product_id: getProduct("LAV500"),
        quantity: 10,
        uom_id: defaultUomId,
        qty_in_stock_uom: 10,
        unit_price: 168000,
        tax_rate_id: vat10,
        line_total: 1680000,
        line_tax: 168000,
        line_total_after_tax: 1848000,
        created_at: now,
        updated_at: now,
      },
      {
        po_id: poId,
        product_id: getProduct("LAV1500"),
        quantity: 5,
        uom_id: defaultUomId,
        qty_in_stock_uom: 5,
        unit_price: 210000,
        tax_rate_id: vat10,
        line_total: 1050000,
        line_tax: 105000,
        line_total_after_tax: 1155000,
        created_at: now,
        updated_at: now,
      },
      {
        po_id: poId,
        product_id: getProduct("LAVSP330"),
        quantity: 8,
        uom_id: defaultUomId,
        qty_in_stock_uom: 8,
        unit_price: 195000,
        tax_rate_id: vat10,
        line_total: 1560000,
        line_tax: 156000,
        line_total_after_tax: 1716000,
        created_at: now,
        updated_at: now,
      },
    ]);

    // ── 5. Stock Move (GRN) — nhập kho đủ số lượng ──────────────────
    if (warehouseId) {
      await queryInterface.bulkInsert("stock_moves", [
        {
          move_no: "GRN-2024-0089",
          move_date: new Date("2024-03-14"),
          type: "receipt",
          warehouse_to_id: warehouseId,
          reference_type: "purchase_order",
          reference_id: poId,
          status: "posted",
          note: "Nhập kho Lavie theo PO-2024-0123 — Demo OCR TC-01",
          created_by: userId,
          created_at: now,
          updated_at: now,
        },
      ]);

      const [moves] = await queryInterface.sequelize.query(
        `SELECT id FROM stock_moves WHERE move_no = 'GRN-2024-0089' LIMIT 1;`,
      );
      const moveId = moves[0].id;

      await queryInterface.bulkInsert("stock_move_lines", [
        {
          move_id: moveId,
          product_id: getProduct("LAV500"),
          quantity: 10,
          uom_id: defaultUomId,
          created_at: now,
          updated_at: now,
        },
        {
          move_id: moveId,
          product_id: getProduct("LAV1500"),
          quantity: 5,
          uom_id: defaultUomId,
          created_at: now,
          updated_at: now,
        },
        {
          move_id: moveId,
          product_id: getProduct("LAVSP330"),
          quantity: 8,
          uom_id: defaultUomId,
          created_at: now,
          updated_at: now,
        },
      ]);

      // ── 6. Stock Balances ──────────────────────────────────────────
      await queryInterface.bulkInsert("stock_balances", [
        {
          warehouse_id: warehouseId,
          product_id: getProduct("LAV500"),
          quantity: 10,
          created_at: now,
          updated_at: now,
        },
        {
          warehouse_id: warehouseId,
          product_id: getProduct("LAV1500"),
          quantity: 5,
          created_at: now,
          updated_at: now,
        },
        {
          warehouse_id: warehouseId,
          product_id: getProduct("LAVSP330"),
          quantity: 8,
          created_at: now,
          updated_at: now,
        },
      ]);
    }
  },

  async down(queryInterface) {
    // Xóa theo thứ tự ngược lại để tránh FK constraint
    await queryInterface.sequelize.query(
      `DELETE FROM stock_balances WHERE product_id IN (SELECT id FROM products WHERE sku IN ('LAV500','LAV1500','LAVSP330'));`,
    );
    await queryInterface.sequelize.query(
      `DELETE FROM stock_move_lines WHERE product_id IN (SELECT id FROM products WHERE sku IN ('LAV500','LAV1500','LAVSP330'));`,
    );
    await queryInterface.sequelize.query(
      `DELETE FROM stock_moves WHERE move_no = 'GRN-2024-0089';`,
    );
    await queryInterface.sequelize.query(
      `DELETE FROM purchase_order_lines WHERE po_id IN (SELECT id FROM purchase_orders WHERE po_no = 'PO-2024-0123');`,
    );
    await queryInterface.sequelize.query(
      `DELETE FROM purchase_orders WHERE po_no = 'PO-2024-0123';`,
    );
    await queryInterface.sequelize.query(
      `DELETE FROM products WHERE sku IN ('LAV500','LAV1500','LAVSP330');`,
    );
    await queryInterface.sequelize.query(
      `DELETE FROM partners WHERE tax_code = '0301234567';`,
    );
  },
};
