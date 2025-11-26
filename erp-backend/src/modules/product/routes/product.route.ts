import { Router } from "express";
import { productController } from "../controllers/product.controller";
import { authMiddleware } from "../../../core/middleware/auth";
import { upload } from "../../../core/middleware/upload";

const router = Router();

router.get(
  "/",
  authMiddleware(["ADMIN", "SALES", "PURCHASE"]),
  productController.getAllProductOnActive
);
router.get(
  "/search",
  authMiddleware(["PURCHASE"]),
  productController.searchProducts
);
router.get(
  "/:id",
  authMiddleware(["ADMIN", "SALES", "PURCHASE"]),
  productController.getProductById
);
router.post(
  "/",
  authMiddleware(["ADMIN"]),
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "gallery", maxCount: 10 },
  ]),
  productController.createProduct
);
router.put(
  "/:id",
  authMiddleware(["ADMIN"]),
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "gallery", maxCount: 10 },
  ]),
  productController.updateProduct
);

router.delete(
  "/:id",
  authMiddleware(["ADMIN"]),
  productController.deleteProduct
);

export default router;
