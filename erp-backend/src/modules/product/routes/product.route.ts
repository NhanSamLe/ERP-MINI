import { Router } from "express";
import { productController } from "../controllers/product.controller";
import { productSupplierInfoController } from "../controllers/productSupplierInfo.controller";
import { authMiddleware } from "../../../core/middleware/auth";
import { upload } from "../../../core/middleware/upload";
import { Role } from "../../../core/types/enum";

const router = Router();

router.get(
  "/",
  authMiddleware([
    Role.ADMIN,
    Role.SALES,
    Role.PURCHASE,
    Role.PURCHASEMANAGER,
    Role.WHSTAFF,
    Role.WHMANAGER,
  ]),
  productController.getAllProductOnActive,
);

router.get(
  "/all",
  authMiddleware([
    Role.ADMIN,
    Role.SALES,
    Role.PURCHASE,
    Role.WHSTAFF,
    Role.PURCHASEMANAGER,
    Role.WHMANAGER,
  ]),
  productController.getAllProductAllStatus,
);

router.get(
  "/search",
  authMiddleware([Role.PURCHASE, Role.WHSTAFF]),
  productController.searchProducts,
);
router.get(
  "/:id",
  authMiddleware([
    Role.ADMIN,
    Role.SALES,
    Role.PURCHASE,
    Role.WHSTAFF,
    Role.PURCHASEMANAGER,
    Role.ACCOUNT,
  ]),
  productController.getProductById,
);
router.post(
  "/",
  authMiddleware([Role.ADMIN]),
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "gallery", maxCount: 10 },
  ]),
  productController.createProduct,
);
router.put(
  "/:id",
  authMiddleware([Role.ADMIN]),
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "gallery", maxCount: 10 },
  ]),
  productController.updateProduct,
);

router.delete(
  "/:id",
  authMiddleware([Role.ADMIN]),
  productController.deleteProduct,
);

// ===== Product Supplier Info Routes =====
router.get(
  "/:productId/suppliers",
  authMiddleware([Role.ADMIN, Role.PURCHASE, Role.PURCHASEMANAGER]),
  productSupplierInfoController.getByProduct,
);

router.post(
  "/:productId/suppliers",
  authMiddleware([Role.ADMIN, Role.PURCHASEMANAGER]),
  productSupplierInfoController.create,
);

router.put(
  "/:productId/suppliers/:id",
  authMiddleware([Role.ADMIN, Role.PURCHASEMANAGER]),
  productSupplierInfoController.update,
);

router.delete(
  "/:productId/suppliers/:id",
  authMiddleware([Role.ADMIN, Role.PURCHASEMANAGER]),
  productSupplierInfoController.delete,
);

router.patch(
  "/:productId/suppliers/:id/set-preferred",
  authMiddleware([Role.ADMIN, Role.PURCHASEMANAGER]),
  productSupplierInfoController.setPreferred,
);

export default router;
