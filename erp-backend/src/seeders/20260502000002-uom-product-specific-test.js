"use strict";

/**
 * Seeder: UOM Product-Specific Conversion Test Data
 *
 * Tạo dữ liệu để test bugfix UOM product-specific conversion trên web:
 *
 * Scenario:
 *   - Lavie 500ml (SKU: LAV500): 1 THUNG = 24 CHAI → factor=24
 *   - iPhone 15 (SKU: PHN001): 1 HOP = 5 CAI → factor=5
 *   - Cả hai dùng cùng cặp UOM (THUNG/HOP → CHAI/CAI)
 *     nhưng factor khác nhau → cần product-specific conversion
 *
 * Cách test:
 *   1. Tạo PO cho Lavie 10 thùng → qty_in_stock_uom phải = 240
 *   2. Tạo PO cho iPhone 2 hộp → qty_in_stock_uom phải = 10
 */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    // ── Lấy UOM IDs hiện có ──────────────────────────────────────────────────
    const [uoms] = await queryInterface.sequelize.query(
      `SELECT id, code FROM uoms;`,
    );

    // Kiểm tra xem đã có THUNG/CHAI chưa, nếu chưa thì tạo
    const existingCodes = uoms.map((u) => u.code);

    if (!existingCodes.includes("THUNG")) {
      await queryInterface.bulkInsert("uoms", [
        { code: "THUNG", name: "Thùng", created_at: now, updated_at: now },
      ]);
    }
    if (!existingCodes.includes("CHAI")) {
      await queryInterface.bulkInsert("uoms", [
        { code: "CHAI", name: "Chai", created_at: now, updated_at: now },
      ]);
    }

    // Lấy lại sau khi insert
    const [uomsAfter] = await queryInterface.sequelize.query(
      `SELECT id, code FROM uoms;`,
    );
    const getUomId = (code) => uomsAfter.find((u) => u.code === code)?.id;

    const thungId = getUomId("THUNG");
    const chaiId = getUomId("CHAI");

    if (!thungId || !chaiId) {
      throw new Error("Cannot find THUNG or CHAI UOM IDs");
    }

    // ── Lấy Product IDs ──────────────────────────────────────────────────────
    const [products] = await queryInterface.sequelize.query(
      `SELECT id, sku FROM products WHERE sku IN ('LAV500', 'PHN001');`,
    );

    const lavieId = products.find((p) => p.sku === "LAV500")?.id;
    const iphoneId = products.find((p) => p.sku === "PHN001")?.id;

    if (!lavieId || !iphoneId) {
      console.warn(
        "⚠️  LAV500 or PHN001 not found — run seeder 13-ocr-demo-data first",
      );
      return;
    }

    // ── Cập nhật product.uom_id để dùng CHAI/THUNG ──────────────────────────
    // Lavie stock UOM = CHAI
    await queryInterface.sequelize.query(
      `UPDATE products SET uom_id = ${chaiId} WHERE sku = 'LAV500';`,
    );
    // iPhone stock UOM = CHAI (cùng UOM để demo cùng cặp)
    await queryInterface.sequelize.query(
      `UPDATE products SET uom_id = ${chaiId} WHERE sku = 'PHN001';`,
    );

    // ── Tạo product-specific UOM conversions ─────────────────────────────────
    // Lavie: 1 THUNG = 24 CHAI (product-specific, factor=24)
    await queryInterface.bulkInsert("uom_conversions", [
      {
        product_id: lavieId,
        from_uom_id: thungId,
        to_uom_id: chaiId,
        factor: 24,
        created_at: now,
        updated_at: now,
      },
    ]);

    // iPhone: 1 THUNG = 5 CHAI (product-specific, factor=5)
    await queryInterface.bulkInsert("uom_conversions", [
      {
        product_id: iphoneId,
        from_uom_id: thungId,
        to_uom_id: chaiId,
        factor: 5,
        created_at: now,
        updated_at: now,
      },
    ]);

    console.log(`✅ Created product-specific UOM conversions:`);
    console.log(`   Lavie (id=${lavieId}): 1 THUNG = 24 CHAI (factor=24)`);
    console.log(`   iPhone (id=${iphoneId}): 1 THUNG = 5 CHAI (factor=5)`);
    console.log(`\n📋 Test steps:`);
    console.log(
      `   1. Tạo PO cho Lavie 10 thùng → qty_in_stock_uom phải = 240`,
    );
    console.log(`   2. Tạo PO cho iPhone 2 hộp → qty_in_stock_uom phải = 10`);
  },

  async down(queryInterface) {
    // Xóa product-specific conversions
    await queryInterface.sequelize.query(
      `DELETE FROM uom_conversions WHERE product_id IS NOT NULL;`,
    );
    // Reset product uom_id
    await queryInterface.sequelize.query(
      `UPDATE products SET uom_id = NULL WHERE sku IN ('LAV500', 'PHN001');`,
    );
  },
};
