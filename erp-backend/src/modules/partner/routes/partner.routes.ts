import { Router } from "express";
import { authMiddleware } from "../../../core/middleware/auth";
import { Role } from "../../../core/types/enum";
import {
  getPartnersHandler,
  getPartnerByIdHandler,
  createPartnerHandler,
  updatePartnerHandler,
  deletePartnerHandler,
} from "../controllers/partner.controller";

const router = Router();

const readRoles = authMiddleware([
  Role.SALES,
  Role.PURCHASE,
  Role.SALESMANAGER,
  Role.PURCHASEMANAGER,
  Role.ACCOUNT,
  Role.CHACC,
  Role.ADMIN,
  Role.CEO,
]);
const writeRoles = authMiddleware([Role.SALESMANAGER, Role.PURCHASEMANAGER]);
const deleteRoles = authMiddleware([Role.ADMIN]);

router.get("/", readRoles, getPartnersHandler);
router.get("/:id", readRoles, getPartnerByIdHandler);
router.post("/", writeRoles, createPartnerHandler);
router.put("/:id", writeRoles, updatePartnerHandler);
router.delete("/:id", deleteRoles, deletePartnerHandler);

export default router;
