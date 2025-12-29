// websocket.config.ts
import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";
import jwt from "jsonwebtoken";
import { env } from "./env";
import { logger } from "./logger";

export function initializeWebSocket(httpServer: HTTPServer): SocketIOServer {
    const io = new SocketIOServer(httpServer, {
        cors: {
            origin: env.cors.origins,
            credentials: true,
        },
        path: "/socket.io",
    });

    // Middleware xác thực JWT
    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth.token;

            if (!token) {
                return next(new Error("Authentication error: No token provided"));
            }

            const decoded = jwt.verify(token, env.jwt.secret) as any;

            // Lưu thông tin user vào socket
            socket.data.user = {
                id: decoded.id,
                username: decoded.username,
                role: decoded.role,
                branch_id: decoded.branch_id,
            };

            logger.info(`WebSocket: User ${decoded.username} (ID: ${decoded.id}) authenticated`);
            next();
        } catch (error) {
            logger.error("WebSocket authentication error:", error);
            next(new Error("Authentication error: Invalid token"));
        }
    });

    // Xử lý kết nối
    io.on("connection", (socket) => {
        const user = socket.data.user;

        if (!user) {
            socket.disconnect();
            return;
        }

        // Join vào room riêng của user (để gửi thông báo cá nhân)
        const userRoom = `user:${user.id}`;
        socket.join(userRoom);

        // Join vào room của branch (nếu cần broadcast theo branch)
        const branchRoom = `branch:${user.branch_id}`;
        socket.join(branchRoom);

        logger.info(
            `WebSocket: User ${user.username} connected. Rooms: ${userRoom}, ${branchRoom}`
        );

        socket.on("disconnect", () => {
            logger.info(`WebSocket: User ${user.username} disconnected`);
        });

        // Có thể thêm các event handlers khác ở đây
        socket.on("mark_notification_read", async (notificationId: number) => {
            // Xử lý đánh dấu đã đọc (sẽ implement trong service)
            logger.info(`User ${user.id} marked notification ${notificationId} as read`);
        });
    });

    logger.info("WebSocket server initialized successfully");
    return io;
}
