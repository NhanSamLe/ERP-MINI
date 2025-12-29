import { createServer } from "http";
import app from "./app";
import { sequelize } from "./config/db";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { initializeWebSocket } from "./config/websocket.config";
import "./models";

const PORT = env.port || 4040;

async function startServer() {
  try {
    await sequelize.authenticate();
    logger.info("Database connected successfully.");

    // Tạo HTTP server từ Express app
    const httpServer = createServer(app);

    // Khởi tạo WebSocket
    const io = initializeWebSocket(httpServer);

    // Gắn io vào app để sử dụng trong services
    app.set("io", io);

    // Lắng nghe HTTP server (thay vì app.listen)
    httpServer.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
      logger.info(`WebSocket server is ready`);
    });
  } catch (error) {
    logger.error("Unable to connect to the database:", error);
    process.exit(1);
  }
}

startServer();

