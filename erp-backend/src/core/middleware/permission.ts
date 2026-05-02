import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth";

/**
 * Middleware kiểm tra user có TẤT CẢ permissions yêu cầu.
 * ADMIN bypass mọi permission check.
 *
 * Sử dụng:
 *   router.post("/", authMiddleware([]), requirePermission("sales.sale_order.create"), controller.create);
 */
export const requirePermission = (...permissionCodes: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // ADMIN bypass mọi permission
    if (user.role === "ADMIN") return next();

    const userPerms = user.permissions || [];
    const hasAll = permissionCodes.every((p) => userPerms.includes(p));

    if (!hasAll) {
      return res.status(403).json({
        message: "Permission denied",
        required: permissionCodes,
      });
    }

    next();
  };
};

/**
 * Middleware kiểm tra user có ÍT NHẤT 1 trong các permissions yêu cầu.
 * ADMIN bypass mọi permission check.
 *
 * Sử dụng:
 *   router.get("/", authMiddleware([]), requireAnyPermission("ar.invoice.view", "sales.sale_order.view"), controller.getAll);
 */
export const requireAnyPermission = (...permissionCodes: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (user.role === "ADMIN") return next();

    const userPerms = user.permissions || [];
    const hasAny = permissionCodes.some((p) => userPerms.includes(p));

    if (!hasAny) {
      return res.status(403).json({
        message: "Permission denied",
        required_any: permissionCodes,
      });
    }

    next();
  };
};
