import { Router } from "express";
import { authMiddleware } from "../../../core/middleware/auth";
import * as priceListController from "../controllers/priceList.controller";

const router = Router();

router.use(authMiddleware([]));

// Endpoint phục vụ tính giá ngay trên client (khi chọn sản phẩm / sổ lệnh)
router.get("/evaluate-price", priceListController.getProductPriceForOrder);

router.get("/", priceListController.getAll);
router.get("/:id", priceListController.getById);
router.post("/", priceListController.create);
router.put("/:id", priceListController.update);
router.delete("/:id", priceListController.remove);

router.post("/:id/items", priceListController.addItems);
router.put("/:id/items/:itemId", priceListController.updateItem);
router.delete("/:id/items/:itemId", priceListController.removeItem);

export default router;
