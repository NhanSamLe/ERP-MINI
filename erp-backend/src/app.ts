import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import routes from "./routes";
import {errorHandler} from "./core/middleware/error";
const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/api", routes);
app.use(errorHandler);
export default app;