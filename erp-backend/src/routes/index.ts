import express from "express";
import authRoutes from "../modules/auth/routes";
import productRoutes from "../modules/product/routes/product.route";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/product", productRoutes);

export default router;
