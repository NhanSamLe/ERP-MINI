import { Router } from "express";
import { authMiddleware } from "../../../core/middleware/auth";
import * as glAccountController from "../controllers/glAccount.controller";

const router = Router();

router.get("/", authMiddleware([]), glAccountController.getAll);
router.get("/:id", authMiddleware([]), glAccountController.getById);
router.post("/", authMiddleware(["CHACC", "ADMIN"]), glAccountController.create);
router.put("/:id", authMiddleware(["CHACC", "ADMIN"]), glAccountController.update);
router.delete("/:id", authMiddleware(["CHACC", "ADMIN"]), glAccountController.remove);

export default router;
