import dotenv from "dotenv";
import cloudinary from "./cloudinary";

dotenv.config(); 

export const env = {
  port: process.env.PORT || 4040,

  db: {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "",
    pass: process.env.DB_PASS || "",
    name: process.env.DB_NAME || "",
  },

  jwt: {
    secret: process.env.JWT_SECRET || "defaultsecret",
    refreshSecret: process.env.JWT_REFRESH_SECRET || "defaultsecret",
    expiresIn: process.env.JWT_EXPIRES_IN ?? "1h",
    refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN ?? "7d",
  },

  mail:{
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
  },
  cloudinary:{
    name: process.env.CLOUDINARY_CLOUD_NAME!,
    key: process.env.CLOUDINARY_API_KEY!,
    secret: process.env.CLOUDINARY_API_SECRET!,
  }
};
