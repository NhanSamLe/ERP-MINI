import express from "express";
import authRoutes from "../modules/auth/routes";
import productRoutes from "../modules/product/routes/product.route";
import productCategoryRoutes from "../modules/product/routes/productCategory.route";
import branchRoutes from "../modules/company/routes";
import productImageRoutes from "../modules/product/routes/productImage.route";
import masterDataRoutes from "../modules/master-data/routes";
import crmRoutes from "../modules/crm/routes";
const router = express.Router();

router.use("/auth", authRoutes);
router.use("/product", productRoutes);
router.use("/product-image", productImageRoutes);
router.use("/product-category", productCategoryRoutes);
router.use("/branch", branchRoutes);
router.use("/master-data", masterDataRoutes);
router.use("/crm", crmRoutes);
export default router;
