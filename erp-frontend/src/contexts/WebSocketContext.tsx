// WebSocketContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";

interface WebSocketContextType {
    socket: Socket | null;
    isConnected: boolean;
}

const WebSocketContext = createContext<WebSocketContextType>({
    socket: null,
    isConnected: false,
});

export const useWebSocket = () => useContext(WebSocketContext);

interface WebSocketProviderProps {
    children: ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const accessToken = useSelector((state: RootState) => state.auth.accessToken);

    useEffect(() => {
        // Chỉ kết nối khi có token
        if (!accessToken) {
            if (socket) {
                socket.disconnect();
                setSocket(null);
                setIsConnected(false);
            }
            return;
        }

        // Tạo kết nối WebSocket
        const SOCKET_URL = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:8888";

        const newSocket = io(SOCKET_URL, {
            auth: {
                token: accessToken,
            },
            transports: ["websocket", "polling"],
        });

        newSocket.on("connect", () => {
            console.log("✅ WebSocket connected");
            setIsConnected(true);
        });

        newSocket.on("disconnect", () => {
            console.log("❌ WebSocket disconnected");
            setIsConnected(false);
        });

        newSocket.on("connect_error", (error) => {
            console.error("WebSocket connection error:", error);
            setIsConnected(false);
        });

        setSocket(newSocket);

        // Cleanup khi unmount hoặc token thay đổi
        return () => {
            newSocket.disconnect();
        };
    }, [accessToken]);

    return (
        <WebSocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </WebSocketContext.Provider>
    );
};
