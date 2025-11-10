import { Router } from "express";
import { productImageController } from "../controllers/productImage.controller";
import { authMiddleware } from "../../../core/middleware/auth";

const router = Router();

router.get(
  "/:productId",
  authMiddleware(["ADMIN", "SALES", "PURCHASE"]),
  productImageController.getProductImagesByProductId
);

router.get(
  "/detail/:id",
  authMiddleware(["ADMIN", "SALES", "PURCHASE"]),
  productImageController.getProductImageById
);

router.post(
  "/",
  authMiddleware(["ADMIN"]),
  productImageController.createProductImage
);

router.put(
  "/:id",
  authMiddleware(["ADMIN"]),
  productImageController.updateProductImage
);

router.delete(
  "/:id",
  authMiddleware(["ADMIN"]),
  productImageController.deleteProductImage
);

export default router;
