import { Router } from "express";
import * as authController from "./controllers/auth.controller";
import { authMiddleware } from "../../core/middleware/auth";
import { upload } from "../../core/middleware/upload";

const router = Router();

router.post("/users",authMiddleware(["ADMIN"]), authController.createUser);
router.post("/login", authController.login);
router.post("/refresh", authController.refresh);
router.post("/request-password-reset", authController.requestPasswordReset);
router.get("/validate-reset-token", authController.validateResetToken);
router.post("/reset-password", authController.resetPassword);
router.get("/me",authMiddleware([]), authController.getInforUser);
router.post("/logout", authMiddleware([]), authController.clearRefreshToken)
router.put("/update-avt",authMiddleware([]), upload.single("avatar"), authController.updateUserAvatar)
router.put("/update-me",authMiddleware([]), authController.updateUserInfo)

export default router;