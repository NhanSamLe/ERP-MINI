import { sequelize } from "./config/db";

async function run() {
  try {
    console.log("Altering table purchase_orders to support 'sent' and 'supplier_accepted' statuses...");
    await sequelize.query(`
      ALTER TABLE purchase_orders 
      MODIFY COLUMN status ENUM(
        'draft',
        'waiting_approval',
        'confirmed',
        'sent',
        'supplier_accepted',
        'partially_received',
        'completed',
        'cancelled'
      ) NOT NULL DEFAULT 'draft';
    `);
    console.log("Altering table po_audit_logs to support 'SEND_EMAIL' action...");
    await sequelize.query(`
      ALTER TABLE po_audit_logs 
      MODIFY COLUMN action ENUM('CREATE', 'UPDATE', 'APPROVE', 'CANCEL', 'SEND_EMAIL') NOT NULL;
    `);
    console.log("✅ Altered successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to alter column:", error);
    process.exit(1);
  }
}

run();
