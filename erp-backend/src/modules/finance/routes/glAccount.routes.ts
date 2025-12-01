import { Router } from "express";
import * as glAccountController from "../controllers/glAccount.controller";

const router = Router();

// GET /finance/gl-accounts?search=111
router.get("/", glAccountController.getAll);

// GET /finance/gl-accounts/1
router.get("/:id", glAccountController.getById);

// POST /finance/gl-accounts
router.post("/", glAccountController.create);

// PUT /finance/gl-accounts/1
router.put("/:id", glAccountController.update);

// DELETE /finance/gl-accounts/1
router.delete("/:id", glAccountController.remove);

export default router;
