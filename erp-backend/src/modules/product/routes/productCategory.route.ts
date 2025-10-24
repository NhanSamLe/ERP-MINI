import { Router } from "express";
import { productCategoryController } from "../controllers/productCategory.controller";
import { authMiddleware } from "../../../core/middleware/auth";

const router = Router();

router.get(
  "/",
  authMiddleware(["ADMIN", "SALES", "PURCHASE"]),
  productCategoryController.getCategoryAll
);
router.get(
  "/:id",
  authMiddleware(["ADMIN", "SALES", "PURCHASE"]),
  productCategoryController.getCategoryById
);
router.post(
  "/",
  authMiddleware(["ADMIN"]),
  productCategoryController.createCategory
);
router.put(
  "/:id",
  authMiddleware(["ADMIN"]),
  productCategoryController.updateCategory
);
router.delete(
  "/:id",
  authMiddleware(["ADMIN"]),
  productCategoryController.deleteCategory
);

export default router;
