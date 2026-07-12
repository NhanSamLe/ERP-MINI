import { sequelize } from "../config/db";

async function run() {
  console.log("🚀 Altering table 'attendances' to support 'holiday' status...");
  try {
    await sequelize.query(`
      ALTER TABLE attendances 
      MODIFY COLUMN status ENUM('present', 'absent', 'leave', 'late', 'holiday') DEFAULT 'present';
    `);
    console.log("✅ Table 'attendances' altered successfully!");
  } catch (error) {
    console.error("❌ Error altering table:", error);
  }
  process.exit(0);
}

run();
