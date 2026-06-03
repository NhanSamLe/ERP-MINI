import { sequelize } from "./config/db";

async function main() {
  try {
    console.log("Adding missing columns to partners table...");
    
    // Check which columns actually exist first
    const [columns]: any[] = await sequelize.query("DESCRIBE partners");
    const existingFields = columns.map((col: any) => col.Field);
    console.log("Existing columns:", existingFields);

    if (!existingFields.includes("type")) {
      console.log("Adding 'type' column...");
      await sequelize.query(`
        ALTER TABLE partners 
        ADD COLUMN type ENUM('customer', 'supplier', 'internal') NULL AFTER id
      `);
      
      console.log("Populating 'type' values for existing rows...");
      await sequelize.query(`
        UPDATE partners SET type = 'customer' WHERE is_customer = 1
      `);
      await sequelize.query(`
        UPDATE partners SET type = 'supplier' WHERE is_supplier = 1
      `);
      await sequelize.query(`
        UPDATE partners SET type = 'internal' WHERE is_customer = 0 AND is_supplier = 0
      `);

      console.log("Setting 'type' to NOT NULL...");
      await sequelize.query(`
        ALTER TABLE partners 
        MODIFY COLUMN type ENUM('customer', 'supplier', 'internal') NOT NULL
      `);
    }

    if (!existingFields.includes("website")) {
      console.log("Adding 'website' column...");
      await sequelize.query("ALTER TABLE partners ADD COLUMN website VARCHAR(255) NULL");
    }

    if (!existingFields.includes("industry")) {
      console.log("Adding 'industry' column...");
      await sequelize.query("ALTER TABLE partners ADD COLUMN industry VARCHAR(100) NULL");
    }

    if (!existingFields.includes("company_size")) {
      console.log("Adding 'company_size' column...");
      await sequelize.query("ALTER TABLE partners ADD COLUMN company_size VARCHAR(50) NULL");
    }

    if (!existingFields.includes("sales_person_id")) {
      console.log("Adding 'sales_person_id' column...");
      await sequelize.query(`
        ALTER TABLE partners 
        ADD COLUMN sales_person_id BIGINT NULL,
        ADD CONSTRAINT fk_partners_sales_person FOREIGN KEY (sales_person_id) REFERENCES users(id) ON DELETE SET NULL
      `);
    }

    console.log("✅ Database schema fixed successfully!");
  } catch (err) {
    console.error("❌ Error altering partners table:", err);
  } finally {
    await sequelize.close();
  }
}

main();
