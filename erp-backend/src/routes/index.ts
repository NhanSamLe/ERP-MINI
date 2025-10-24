import express from "express";
import authRoutes from "../modules/auth/routes";
import productRoutes from "../modules/product/routes/product.route";
import productCategoryRoutes from "../modules/product/routes/productCategory.route";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/product", productRoutes);
router.use("/product-category", productCategoryRoutes);

export default router;
