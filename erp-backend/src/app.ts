import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";
import routes from "./routes";
import { errorHandler } from "./core/middleware/error";
import { translationMiddleware } from "./core/middleware/translation";
import "./modules/master-data/services/currency.cron";
import "./modules/purchase/services/purchase.cron";
import { startAgentScheduler } from "./modules/ai-agent/services/agentScheduler.service";
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
app.use(translationMiddleware);
app.use("/api", routes);
app.use(errorHandler);

// Log OCR config on startup for audit
ocrConfig.logConfigOnStartup();

// Start AI agent scheduled jobs
startAgentScheduler();

export default app;
