import { Router } from "express";
import { authMiddleware } from "../../../core/middleware/auth";
import {
  getPartnersHandler,
  getPartnerByIdHandler,
  createPartnerHandler,
  updatePartnerHandler,
  deletePartnerHandler,
} from "../controllers/partner.controller";

const router = Router();

// Tất cả partner routes đều yêu cầu authentication
router.get("/", authMiddleware([]), getPartnersHandler);
router.get("/:id", authMiddleware([]), getPartnerByIdHandler);
router.post("/", authMiddleware([]), createPartnerHandler);
router.put("/:id", authMiddleware([]), updatePartnerHandler);
router.delete("/:id", authMiddleware([]), deletePartnerHandler);

export default router;
