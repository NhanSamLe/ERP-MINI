"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    // 1. Lấy user có role SALES
    const [salesUsers] = await queryInterface.sequelize.query(`
      SELECT u.id, u.username 
      FROM users u
      JOIN user_roles ur ON ur.user_id = u.id
      JOIN roles r ON r.id = ur.role_id
      WHERE r.code = 'SALES'
    `);
    const salesUserId = salesUsers.length > 0 ? salesUsers[0].id : null;

    // 2. CRM Leads
    await queryInterface.bulkInsert("crm_leads", [
      {
        name: "Lead Nguyen Van B",
        email: "lead1@example.com",
        phone: "0911222333",
        source: "Website",
        assigned_to: salesUserId,
        stage: "new",
        created_at: now,
        updated_at: now,
      },
      {
        name: "Lead Tran Thi C",
        email: "lead2@example.com",
        phone: "0944555666",
        source: "Facebook",
        assigned_to: salesUserId,
        stage: "qualified",
        created_at: now,
        updated_at: now,
      },
    ]);

    // 3. Truy xuất dữ liệu cần cho CRM & Sales
    const [leads] = await queryInterface.sequelize.query(`SELECT id FROM crm_leads;`);
    const [partners] = await queryInterface.sequelize.query(`SELECT id, type FROM partners;`);
    const [users] = await queryInterface.sequelize.query(`SELECT id, username FROM users;`);
    const [products] = await queryInterface.sequelize.query(`SELECT id, sku FROM products;`);
    const [taxRates] = await queryInterface.sequelize.query(`SELECT id, code FROM tax_rates;`);
    const [branches] = await queryInterface.sequelize.query(`SELECT id FROM branches;`);

    function getCustomer() {
      return partners.find((p) => p.type === "customer").id;
    }
    function getUser(username) {
      const u = users.find((u) => u.username === username);
      return u ? u.id : null;
    }
    function getProduct(sku) {
      return products.find((p) => p.sku === sku).id;
    }
    function getTax(code) {
      return taxRates.find((t) => t.code === code).id;
    }
    const branchId = branches[0].id;

    // 4. CRM Opportunities
    await queryInterface.bulkInsert("crm_opportunities", [
      {
        lead_id: leads[0].id,
        customer_id: getCustomer(),
        name: "Laptop deal",
        stage: "prospecting",
        expected_value: 5000,
        probability: 0.5,
        owner_id: salesUserId,
        created_at: now,
        updated_at: now,
      },
      {
        lead_id: leads[1].id,
        customer_id: getCustomer(),
        name: "iPhone order",
        stage: "negotiation",
        expected_value: 12000,
        probability: 0.7,
        owner_id: salesUserId,
        created_at: now,
        updated_at: now,
      },
    ]);

    const [opps] = await queryInterface.sequelize.query(`SELECT id, name FROM crm_opportunities;`);

    // 5. CRM Activities
    await queryInterface.bulkInsert("crm_activities", [
      {
        related_type: "lead",
        related_id: leads[0].id,
        activity_type: "call",
        subject: "Call customer about laptop",
        due_at: new Date(),
        done: false,
        owner_id: salesUserId,
        created_at: now,
        updated_at: now,
      },
      {
        related_type: "opportunity",
        related_id: opps[0].id,
        activity_type: "meeting",
        subject: "Discuss laptop pricing",
        due_at: new Date(),
        done: false,
        owner_id: getUser("salesmanager01"),
        created_at: now,
        updated_at: now,
      },
    ]);

    // 6. Sale Orders
    await queryInterface.bulkInsert("sale_orders", [
      {
        branch_id: branchId,
        order_no: "SO001",
        customer_id: getCustomer(),
        order_date: new Date(),
        status: "confirmed",
        total_before_tax: 1000,
        total_tax: 100,
        total_after_tax: 1100,
        created_at: now,
        updated_at: now,
      },
      {
        branch_id: branchId,
        order_no: "SO002",
        customer_id: getCustomer(),
        order_date: new Date(),
        status: "draft",
        total_before_tax: 2000,
        total_tax: 200,
        total_after_tax: 2200,
        created_at: now,
        updated_at: now,
      },
    ]);

    const [orders] = await queryInterface.sequelize.query(`SELECT id, order_no FROM sale_orders;`);

    function getOrder(orderNo) {
      return orders.find((o) => o.order_no === orderNo).id;
    }

    // 7. Sale Order Lines
    await queryInterface.bulkInsert("sale_order_lines", [
      {
        order_id: getOrder("SO001"),
        product_id: getProduct("LAP001"),
        description: "Dell Inspiron 15",
        quantity: 2,
        unit_price: 500,
        tax_rate_id: getTax("VAT10"),
        line_total: 1100,
        created_at: now,
        updated_at: now,
      },
      {
        order_id: getOrder("SO002"),
        product_id: getProduct("PHN001"),
        description: "iPhone 15",
        quantity: 1,
        unit_price: 1200,
        tax_rate_id: getTax("VAT10"),
        line_total: 1200,
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("sale_order_lines", null, {});
    await queryInterface.bulkDelete("sale_orders", null, {});
    await queryInterface.bulkDelete("crm_activities", null, {});
    await queryInterface.bulkDelete("crm_opportunities", null, {});
    await queryInterface.bulkDelete("crm_leads", null, {});
  },
};
