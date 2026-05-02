import { Router } from "express";
import { authMiddleware } from "../../../core/middleware/auth";
import * as quotationController from "../controllers/quotation.controller";

const router = Router();

router.use(authMiddleware);

router.get("/", quotationController.getAll);
router.get("/:id", quotationController.getById);
router.post("/", quotationController.create);
router.put("/:id", quotationController.update);
router.patch("/:id/submit", quotationController.submit);
router.patch("/:id/approve", quotationController.approve);
router.patch("/:id/accept", quotationController.markAccepted);
router.post("/:id/convert-to-order", quotationController.convertToOrder);

export default router;
