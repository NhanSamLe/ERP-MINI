import dotenv from "dotenv";

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
    expiresIn: "1d",
  },
};
