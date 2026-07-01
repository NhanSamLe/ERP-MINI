import { Sequelize } from "sequelize";
import { env } from "../config/env";

// Bật SSL khi kết nối RDS trên AWS (RDS bắt buộc SSL).
// Local MySQL thường không có SSL → set DB_SSL=false (hoặc bỏ trống) để tắt.
const useSsl = process.env.DB_SSL === "true";

export const sequelize = new Sequelize(env.db.name, env.db.user, env.db.pass, {
  host: env.db.host,
  port: env.db.port,
  dialect: "mysql",
  logging: false,
  dialectOptions: useSsl
    ? {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      }
    : {},
});


export async function connectDB() {
  try {
    await sequelize.authenticate();
    console.log("✅ DB connected successfully");
  } catch (error) {
    console.error("❌ DB connection failed:", error);
  }
}; 
