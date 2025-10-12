import { Router } from "express";
import { productController } from "../controllers/product.controller";
import { authMiddleware } from "../../../core/middleware/auth";

const router = Router();

router.get(
  "/",
  authMiddleware(["ADMIN", "SALES", "PURCHASE"]),
  productController.getAllProduct
);
router.get(
  "/:id",
  authMiddleware(["ADMIN", "SALES", "PURCHASE"]),
  productController.getProductById
);
router.post("/", authMiddleware(["ADMIN"]), productController.createProduct);
router.put("/:id", authMiddleware(["ADMIN"]), productController.updateProduct);
router.delete(
  "/:id",
  authMiddleware(["ADMIN"]),
  productController.deleteProduct
);

export default router;
