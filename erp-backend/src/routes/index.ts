import express from "express";
import authRoutes from "../modules/auth/routes";

const router = express.Router();

router.use("/auth", authRoutes);

export default router;
