import { createLogger, format, transports } from "winston";

const { combine, timestamp, printf, colorize } = format;

// Định nghĩa format log
const logFormat = printf(({ level, message, timestamp }) => {
  return `[${timestamp}] ${level}: ${message}`;
});

export const logger = createLogger({
  level: "info", // default log level
  format: combine(
    colorize(),
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    logFormat
  ),
  transports: [
    new transports.Console(), // log ra console
    new transports.File({ filename: "logs/error.log", level: "error" }), // log lỗi
    new transports.File({ filename: "logs/combined.log" }) // log toàn bộ
  ],
});
