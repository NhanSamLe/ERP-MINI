import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";
import routes from "./routes";
import {errorHandler} from "./core/middleware/error";
import "./modules/master-data/services/currency.cron"; 
import { env } from "./config/env";
const app = express();

app.use(
  cors({
    origin: env.cors.origins,
    credentials: true,
  })
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/api", routes);
app.use(errorHandler);
export default app;