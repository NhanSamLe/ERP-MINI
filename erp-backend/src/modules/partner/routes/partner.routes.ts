import { Router } from "express";
import {
  getPartnersHandler,
  getPartnerByIdHandler,
  createPartnerHandler,
  updatePartnerHandler,
  deletePartnerHandler,
} from "../controllers/partner.controller";

const router = Router();

router.get("/", getPartnersHandler);
router.get("/:id", getPartnerByIdHandler);
router.post("/", createPartnerHandler);
router.put("/:id", updatePartnerHandler);
router.delete("/:id", deletePartnerHandler);

export default router;
