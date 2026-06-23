"use strict";

/**
 * Seed: Test users cho từng role — password: 123456
 *
 * Username = tên role (lowercase), ví dụ:
 *   admin / ceo / branch_manager / salesmanager / sales /
 *   whmanager / whstaff / chacc / account / hrmanager /
 *   purchasemanager / purchase
 *
 * branch_id = NULL (điền sau khi setup company)
 *
 * Chạy: npx sequelize-cli db:seed --seed 20260608000002-seed-test-users.js
 * Undo: npx sequelize-cli db:seed:undo --seed 20260608000002-seed-test-users.js
 */

// bcrypt hash của "123456" với saltRounds=10
const PASSWORD_HASH = "$2b$10$aDBkXC3lmoum6XknXqXCSO3f/nkKNEGaSWUrE8GXqZLQa9tVJhkuq";

const TEST_USERS = [
  { username: "admin",          full_name: "Quản Trị Viên",          email: "admin@erp-mini.local",          phone: "0900000001", role: "ADMIN"           },
  { username: "ceo",            full_name: "Giám Đốc Điều Hành",      email: "ceo@erp-mini.local",            phone: "0900000002", role: "CEO"             },
  { username: "branch_manager", full_name: "Quản Lý Chi Nhánh",       email: "branchmanager@erp-mini.local",  phone: "0900000003", role: "BRANCH_MANAGER"  },
  { username: "salesmanager",   full_name: "Quản Lý Bán Hàng",        email: "salesmanager@erp-mini.local",   phone: "0900000004", role: "SALESMANAGER"    },
  { username: "sales",          full_name: "Nhân Viên Bán Hàng",      email: "sales@erp-mini.local",          phone: "0900000005", role: "SALES"           },
  { username: "whmanager",      full_name: "Quản Lý Kho",             email: "whmanager@erp-mini.local",      phone: "0900000006", role: "WHMANAGER"       },
  { username: "whstaff",        full_name: "Nhân Viên Kho",           email: "whstaff@erp-mini.local",        phone: "0900000007", role: "WHSTAFF"         },
  { username: "chacc",          full_name: "Kế Toán Trưởng",          email: "chacc@erp-mini.local",          phone: "0900000008", role: "CHACC"           },
  { username: "account",        full_name: "Kế Toán Viên",            email: "account@erp-mini.local",        phone: "0900000009", role: "ACCOUNT"         },
  { username: "hrmanager",      full_name: "Quản Lý Nhân Sự",         email: "hrmanager@erp-mini.local",      phone: "0900000010", role: "HRMANAGER"       },
  { username: "purchasemanager",full_name: "Quản Lý Mua Hàng",        email: "purchasemanager@erp-mini.local",phone: "0900000011", role: "PURCHASEMANAGER" },
  { username: "purchase",       full_name: "Nhân Viên Mua Hàng",      email: "purchase@erp-mini.local",       phone: "0900000012", role: "PURCHASE"        },
];

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    // Lấy tất cả role ids
    const roles = await queryInterface.sequelize.query(
      "SELECT id, code FROM roles",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    const roleMap = Object.fromEntries(roles.map((r) => [r.code, r.id]));

    // Kiểm tra roles bắt buộc phải có
    const missingRoles = TEST_USERS.filter((u) => !roleMap[u.role]).map((u) => u.role);
    if (missingRoles.length > 0) {
      throw new Error(
        `Thiếu roles: ${missingRoles.join(", ")}.\n` +
        `Hãy chạy seed roles trước: npm run seed:roles`
      );
    }

    // Lấy danh sách username đã tồn tại để skip
    const existingUsers = await queryInterface.sequelize.query(
      `SELECT username FROM users WHERE username IN (${TEST_USERS.map((u) => `'${u.username}'`).join(",")})`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    const existingUsernames = new Set(existingUsers.map((u) => u.username));

    const newUsers = TEST_USERS
      .filter((u) => !existingUsernames.has(u.username))
      .map((u) => ({
        branch_id:       null,   // để trống — điền sau khi setup company
        username:        u.username,
        password_hash:   PASSWORD_HASH,
        full_name:       u.full_name,
        email:           u.email,
        phone:           u.phone,
        role_id:         roleMap[u.role],
        is_active:       true,
        reset_token:     null,
        reset_expires_at:null,
        created_at:      now,
        updated_at:      now,
      }));

    if (newUsers.length === 0) {
      console.log("⏭️  Tất cả test users đã tồn tại, bỏ qua.");
      return;
    }

    await queryInterface.bulkInsert("users", newUsers);
    console.log(`✅ Đã tạo ${newUsers.length} test users:`);
    newUsers.forEach((u) => console.log(`   - ${u.username.padEnd(16)} | ${u.full_name}`));
    console.log(`\n   Password chung: 123456`);
    console.log(`   branch_id: NULL (vào Admin → điền branch sau)`);
  },

  async down(queryInterface) {
    const usernames = TEST_USERS.map((u) => `'${u.username}'`).join(",");
    await queryInterface.sequelize.query(
      `DELETE FROM users WHERE username IN (${usernames})`
    );
    console.log("↩️  Đã xóa toàn bộ test users.");
  },
};
