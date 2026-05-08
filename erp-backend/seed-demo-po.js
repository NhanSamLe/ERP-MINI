/**
 * Seed script: Tạo 1 PO demo với trạng thái "confirmed" (đã duyệt)
 * dùng dữ liệu thật từ DB (ABC Supplies Ltd - SUP123, products có sẵn)
 *
 * Chạy: node seed-demo-po.js
 */
require("dotenv").config();
const { Sequelize } = require("sequelize");

const seq = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "mysql",
    logging: false,
  },
);

(async () => {
  try {
    await seq.authenticate();
    console.log("✅ Connected to DB");

    // Lấy dữ liệu cần thiết
    const [[branch]] = await seq.query(
      "SELECT id, name FROM branches WHERE id = 1 LIMIT 1",
    );
    const [[supplier]] = await seq.query(
      "SELECT id, name, tax_code FROM partners WHERE tax_code = 'SUP123' LIMIT 1",
    );
    const [[user]] = await seq.query("SELECT id FROM users LIMIT 1");
    const [products] = await seq.query(
      "SELECT id, name, cost_price FROM products WHERE status = 'active' LIMIT 3",
    );

    if (!branch || !supplier || !user || products.length === 0) {
      console.error(
        "❌ Thiếu dữ liệu cần thiết. Hãy chắc chắn DB có branch, supplier SUP123, user và products.",
      );
      process.exit(1);
    }

    console.log(`📦 Branch: ${branch.name} (id=${branch.id})`);
    console.log(
      `🏢 Supplier: ${supplier.name} (id=${supplier.id}, MST=${supplier.tax_code})`,
    );
    console.log(`👤 User id: ${user.id}`);

    // Kiểm tra PO demo đã tồn tại chưa
    const [[existingPO]] = await seq.query(
      "SELECT id FROM purchase_orders WHERE po_no = 'PO-DEMO-OCR-001' LIMIT 1",
    );
    if (existingPO) {
      console.log(
        `⚠️  PO-DEMO-OCR-001 đã tồn tại (id=${existingPO.id}), bỏ qua.`,
      );
      process.exit(0);
    }

    // Tính toán tổng tiền
    const lines = products.map((p, i) => ({
      product_id: p.id,
      product_name: p.name,
      quantity: [3, 2, 1][i] || 1,
      unit_price: parseFloat(p.cost_price) || 500,
    }));

    lines.forEach((l) => {
      l.line_total = l.quantity * l.unit_price;
      l.line_tax = Math.round(l.line_total * 0.1 * 100) / 100;
      l.line_total_after_tax = l.line_total + l.line_tax;
    });

    const total_before_tax = lines.reduce((s, l) => s + l.line_total, 0);
    const total_tax = lines.reduce((s, l) => s + l.line_tax, 0);
    const total_after_tax = total_before_tax + total_tax;

    // Tạo PO
    const [poResult] = await seq.query(
      `INSERT INTO purchase_orders
        (branch_id, po_no, supplier_id, order_date, status,
         total_before_tax, total_tax, total_after_tax,
         description, created_by, approved_by, approved_at, created_at, updated_at)
       VALUES (?, 'PO-DEMO-OCR-001', ?, NOW(), 'confirmed',
               ?, ?, ?,
               'PO demo để test chức năng OCR Document Intelligence',
               ?, ?, NOW(), NOW(), NOW())`,
      {
        replacements: [
          branch.id,
          supplier.id,
          total_before_tax,
          total_tax,
          total_after_tax,
          user.id,
          user.id,
        ],
      },
    );

    const poId = poResult;
    console.log(`\n✅ Tạo PO thành công: PO-DEMO-OCR-001 (id=${poId})`);

    // Tạo PO lines
    for (const line of lines) {
      await seq.query(
        `INSERT INTO purchase_order_lines
          (po_id, product_id, quantity, unit_price, tax_rate_id,
           line_total, line_tax, line_total_after_tax, created_at, updated_at)
         VALUES (?, ?, ?, ?, 1, ?, ?, ?, NOW(), NOW())`,
        {
          replacements: [
            poId,
            line.product_id,
            line.quantity,
            line.unit_price,
            line.line_total,
            line.line_tax,
            line.line_total_after_tax,
          ],
        },
      );
      console.log(
        `   📋 Line: ${line.product_name} x${line.quantity} @ ${line.unit_price.toLocaleString("vi-VN")} VNĐ`,
      );
    }

    console.log(`\n📊 Tổng kết:`);
    console.log(
      `   Tiền hàng:  ${total_before_tax.toLocaleString("vi-VN")} VNĐ`,
    );
    console.log(`   Thuế 10%:   ${total_tax.toLocaleString("vi-VN")} VNĐ`);
    console.log(
      `   Tổng cộng:  ${total_after_tax.toLocaleString("vi-VN")} VNĐ`,
    );
    console.log(`\n🎯 Supplier: ${supplier.name} (MST: ${supplier.tax_code})`);
    console.log(
      `   → Upload hóa đơn của ${supplier.name} để demo 3-way matching!`,
    );
  } catch (err) {
    console.error("❌ Lỗi:", err.message);
  } finally {
    await seq.close();
    process.exit(0);
  }
})();
