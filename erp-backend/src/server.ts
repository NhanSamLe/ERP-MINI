import app from "./app";
import { sequelize } from "./config/db";
import {env} from "./config/env";
import { logger } from "./config/logger";
import "./models"; 
const PORT = env.port || 4040;
async function startServer() {
  try {
    await sequelize.authenticate();
    logger.info("Database connected successfully.");
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    logger.error("Unable to connect to the database:", error);
    process.exit(1);
  }
}
startServer();
