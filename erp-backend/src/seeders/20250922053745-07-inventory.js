"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    // Lấy dữ liệu tham chiếu
    const [branches] = await queryInterface.sequelize.query(`SELECT id FROM branches;`);
    const [products] = await queryInterface.sequelize.query(`SELECT id, sku FROM products;`);
    const [poLines] = await queryInterface.sequelize.query(`SELECT id, po_id, product_id, quantity FROM purchase_order_lines;`);
    const [soLines] = await queryInterface.sequelize.query(`SELECT id, order_id, product_id, quantity FROM sale_order_lines;`);
    const [pos] = await queryInterface.sequelize.query(`SELECT id, po_no FROM purchase_orders;`);
    const [sos] = await queryInterface.sequelize.query(`SELECT id, order_no FROM sale_orders;`);

    const branchId = branches[0].id;

    function getProduct(sku) {
      return products.find((p) => p.sku === sku).id;
    }
    function getPO(no) {
      return pos.find((p) => p.po_no === no).id;
    }
    function getSO(no) {
      return sos.find((s) => s.order_no === no).id;
    }

    // 1. Warehouses
    await queryInterface.bulkInsert("warehouses", [
      {
        branch_id: branchId,
        code: "WH-HCM",
        name: "Kho HCM",
        address: "123 Đường ABC, TP.HCM",
        created_at: now,
        updated_at: now,
      },
      {
        branch_id: branchId,
        code: "WH-HN",
        name: "Kho Hà Nội",
        address: "456 Đường XYZ, Hà Nội",
        created_at: now,
        updated_at: now,
      },
    ]);

    const [warehouses] = await queryInterface.sequelize.query(`SELECT id, code FROM warehouses;`);

    function getWarehouse(code) {
      return warehouses.find((w) => w.code === code).id;
    }

    // 2. Stock Moves (nhập từ PO001, xuất cho SO001)
    await queryInterface.bulkInsert("stock_moves", [
      {
        move_no: "SM001",
        move_date: new Date(),
        type: "receipt",
        warehouse_id: getWarehouse("WH-HCM"),
        reference_type: "purchase_order",
        reference_id: getPO("PO001"),
        status: "posted",
        note: "Nhập kho PO001",
        created_at: now,
        updated_at: now,
      },
      {
        move_no: "SM002",
        move_date: new Date(),
        type: "issue",
        warehouse_id: getWarehouse("WH-HCM"),
        reference_type: "sale_order",
        reference_id: getSO("SO001"),
        status: "posted",
        note: "Xuất kho SO001",
        created_at: now,
        updated_at: now,
      },
    ]);

    const [moves] = await queryInterface.sequelize.query(`SELECT id, move_no FROM stock_moves;`);

    function getMove(no) {
      return moves.find((m) => m.move_no === no).id;
    }

    // 3. Stock Move Lines
    await queryInterface.bulkInsert("stock_move_lines", [
      {
        move_id: getMove("SM001"),
        product_id: getProduct("LAP001"),
        quantity: 2,
        uom: "PCS",
        created_at: now,
        updated_at: now,
      },
      {
        move_id: getMove("SM002"),
        product_id: getProduct("LAP001"),
        quantity: 2,
        uom: "PCS",
        created_at: now,
        updated_at: now,
      },
    ]);

    // 4. Stock Balances (sau khi nhập & xuất, còn lại 0)
    await queryInterface.bulkInsert("stock_balances", [
      {
        warehouse_id: getWarehouse("WH-HCM"),
        product_id: getProduct("LAP001"),
        quantity: 0, // nhập 2 rồi xuất hết 2
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("stock_balances", null, {});
    await queryInterface.bulkDelete("stock_move_lines", null, {});
    await queryInterface.bulkDelete("stock_moves", null, {});
    await queryInterface.bulkDelete("warehouses", null, {});
  },
};
