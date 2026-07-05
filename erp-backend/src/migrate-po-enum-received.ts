import { sequelize } from "./config/db";

async function run() {
  try {
    console.log("Altering table purchase_orders to support 'received' status...");
    await sequelize.query(`
      ALTER TABLE purchase_orders 
      MODIFY COLUMN status ENUM(
        'draft',
        'waiting_approval',
        'confirmed',
        'sent',
        'supplier_accepted',
        'partially_received',
        'received',
        'completed',
        'cancelled'
      ) NOT NULL DEFAULT 'draft';
    `);
    console.log("✅ Altered status enum successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to alter status column:", error);
    process.exit(1);
  }
}

run();
