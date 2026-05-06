import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";
import routes from "./routes";
import { errorHandler } from "./core/middleware/error";
import "./modules/master-data/services/currency.cron";
import { env } from "./config/env";
import { ocrConfig } from "./modules/document-intelligence/services/ocrConfig.service";

const app = express();

app.use(
  cors({
    origin: env.cors.origins,
    credentials: true,
  }),
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check endpoint (for Render/Docker health checks)
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api", routes);
app.use(errorHandler);

// Log OCR config on startup for audit
ocrConfig.logConfigOnStartup();

export default app;
