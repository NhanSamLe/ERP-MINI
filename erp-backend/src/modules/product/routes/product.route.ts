import { Router } from "express";
import { productController } from "../controllers/product.controller";
import { authMiddleware } from "../../../core/middleware/auth";
import { upload } from "../../../core/middleware/upload";
import { Role } from "../../../core/types/enum";

const router = Router();

router.get(
  "/",
  authMiddleware([Role.ADMIN, Role.SALES, Role.PURCHASE, Role.PURCHASEMANAGER]),
  productController.getAllProductOnActive
);

router.get(
  "/all",
  authMiddleware([
    Role.ADMIN,
    Role.SALES,
    Role.PURCHASE,
    Role.WHSTAFF,
    Role.PURCHASEMANAGER,
  ]),
  productController.getAllProductAllStatus
);

router.get(
  "/search",
  authMiddleware([Role.PURCHASE, Role.WHSTAFF]),
  productController.searchProducts
);
router.get(
  "/:id",
  authMiddleware([
    Role.ADMIN,
    Role.SALES,
    Role.PURCHASE,
    Role.WHSTAFF,
    Role.PURCHASEMANAGER,
  ]),
  productController.getProductById
);
router.post(
  "/",
  authMiddleware([Role.ADMIN]),
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "gallery", maxCount: 10 },
  ]),
  productController.createProduct
);
router.put(
  "/:id",
  authMiddleware([Role.ADMIN]),
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "gallery", maxCount: 10 },
  ]),
  productController.updateProduct
);

router.delete(
  "/:id",
  authMiddleware([Role.ADMIN]),
  productController.deleteProduct
);

export default router;
