"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    // 1. Insert đầy đủ roles trong ERP
    await queryInterface.bulkInsert("roles", [
      { code: "ADMIN", name: "System Administrator", created_at: now, updated_at: now },
      { code: "CEO", name: "Chief Executive Officer", created_at: now, updated_at: now },
      { code: "SALESMANAGER", name: "Sales Manager", created_at: now, updated_at: now },
      { code: "SALES", name: "Sales Staff", created_at: now, updated_at: now },
      { code: "WHMANAGER", name: "Warehouse Manager", created_at: now, updated_at: now },
      { code: "WHSTAFF", name: "Warehouse Staff", created_at: now, updated_at: now },
      { code: "CHACC", name: "Chief Accountant", created_at: now, updated_at: now },
      { code: "ACCOUNT", name: "Accountant", created_at: now, updated_at: now },
      { code: "HRMANAGER", name: "HR Manager", created_at: now, updated_at: now },
      { code: "EMPLOYEE", name: "Employee", created_at: now, updated_at: now },
    ]);

    // 2. Lấy id branch để gán user
    const [branches] = await queryInterface.sequelize.query(
      `SELECT id FROM branches WHERE code = 'BR01';`
    );
    const branchId = branches[0].id;

    // 3. Tạo users tương ứng với roles
    await queryInterface.bulkInsert("users", [
      {
        branch_id: branchId,
        username: "admin",
        password_hash: "hash_admin",
        full_name: "System Admin",
        email: "admin@uteerp.com",
        phone: "0909000001",
        is_active: true,
        reset_token: null,
        reset_expires_at: null,
        created_at: now,
        updated_at: now,
      },
      {
        branch_id: branchId,
        username: "ceo01",
        password_hash: "hash_ceo",
        full_name: "CEO Nguyen Van A",
        email: "ceo@uteerp.com",
        phone: "0909000002",
        is_active: true,
        reset_token: null,
        reset_expires_at: null,
        created_at: now,
        updated_at: now,
      },
      {
        branch_id: branchId,
        username: "salesmanager01",
        password_hash: "hash_salesmanager",
        full_name: "Sales Manager Tran Van B",
        email: "smanager@uteerp.com",
        phone: "0909000003",
        is_active: true,
        reset_token: null,
        reset_expires_at: null,
        created_at: now,
        updated_at: now,
      },
      {
        branch_id: branchId,
        username: "sales01",
        password_hash: "hash_sales01",
        full_name: "Sales Staff 1",
        email: "sales01@uteerp.com",
        phone: "0909000004",
        is_active: true,
        reset_token: null,
        reset_expires_at: null,
        created_at: now,
        updated_at: now,
      },
      {
        branch_id: branchId,
        username: "whmanager01",
        password_hash: "hash_whmanager",
        full_name: "Warehouse Manager Le Thi C",
        email: "whmanager@uteerp.com",
        phone: "0909000005",
        is_active: true,
        reset_token: null,
        reset_expires_at: null,
        created_at: now,
        updated_at: now,
      },
      {
        branch_id: branchId,
        username: "whstaff01",
        password_hash: "hash_whstaff",
        full_name: "Warehouse Staff 1",
        email: "whstaff01@uteerp.com",
        phone: "0909000006",
        is_active: true,
        reset_token: null,
        reset_expires_at: null,
        created_at: now,
        updated_at: now,
      },
      {
        branch_id: branchId,
        username: "chiefacc01",
        password_hash: "hash_chiefacc",
        full_name: "Chief Accountant Pham Van D",
        email: "chiefacc@uteerp.com",
        phone: "0909000007",
        is_active: true,
        reset_token: null,
        reset_expires_at: null,
        created_at: now,
        updated_at: now,
      },
      {
        branch_id: branchId,
        username: "account01",
        password_hash: "hash_account01",
        full_name: "Accountant 1",
        email: "account01@uteerp.com",
        phone: "0909000008",
        is_active: true,
        reset_token: null,
        reset_expires_at: null,
        created_at: now,
        updated_at: now,
      },
      {
        branch_id: branchId,
        username: "hrmanager01",
        password_hash: "hash_hrmanager",
        full_name: "HR Manager Ngo Thi E",
        email: "hrmanager@uteerp.com",
        phone: "0909000009",
        is_active: true,
        reset_token: null,
        reset_expires_at: null,
        created_at: now,
        updated_at: now,
      },
      {
        branch_id: branchId,
        username: "employee01",
        password_hash: "hash_employee01",
        full_name: "Employee 1",
        email: "employee01@uteerp.com",
        phone: "0909000010",
        is_active: true,
        reset_token: null,
        reset_expires_at: null,
        created_at: now,
        updated_at: now,
      },
    ]);

    // 4. Map user <-> role
    const [roles] = await queryInterface.sequelize.query(`SELECT id, code FROM roles;`);
    const [users] = await queryInterface.sequelize.query(`SELECT id, username FROM users;`);

    function getRoleId(code) {
      return roles.find((r) => r.code === code).id;
    }
    function getUserId(username) {
      return users.find((u) => u.username === username).id;
    }

    await queryInterface.bulkInsert("user_roles", [
      { user_id: getUserId("admin"), role_id: getRoleId("ADMIN"), created_at: now, updated_at: now },
      { user_id: getUserId("ceo01"), role_id: getRoleId("CEO"), created_at: now, updated_at: now },
      { user_id: getUserId("salesmanager01"), role_id: getRoleId("SALESMANAGER"), created_at: now, updated_at: now },
      { user_id: getUserId("sales01"), role_id: getRoleId("SALES"), created_at: now, updated_at: now },
      { user_id: getUserId("whmanager01"), role_id: getRoleId("WHMANAGER"), created_at: now, updated_at: now },
      { user_id: getUserId("whstaff01"), role_id: getRoleId("WHSTAFF"), created_at: now, updated_at: now },
      { user_id: getUserId("chiefacc01"), role_id: getRoleId("CHACC"), created_at: now, updated_at: now },
      { user_id: getUserId("account01"), role_id: getRoleId("ACCOUNT"), created_at: now, updated_at: now },
      { user_id: getUserId("hrmanager01"), role_id: getRoleId("HRMANAGER"), created_at: now, updated_at: now },
      { user_id: getUserId("employee01"), role_id: getRoleId("EMPLOYEE"), created_at: now, updated_at: now },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("user_roles", null, {});
    await queryInterface.bulkDelete("users", null, {});
    await queryInterface.bulkDelete("roles", null, {});
  },
};
