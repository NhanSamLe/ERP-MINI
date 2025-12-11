import {Sequelize} from "sequelize";
import { env } from "../config/env";

export const sequelize = new Sequelize(env.db.name, env.db.user, env.db.pass, {
  host: env.db.host,
  port: env.db.port, 
  dialect: "mysql",
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
});


export async function connectDB() {
  try {
    await sequelize.authenticate();
    console.log("✅ DB connected successfully");
  } catch (error) {
    console.error("❌ DB connection failed:", error);
  }
}; 
