import { Request, Response } from "express";
import * as authService from "../services/auth.service";
import * as model from "../../../models/index";
import { getCookieMaxAge } from "../../../core/utils/jwt";

export const createUser = async (req: Request, res: Response) => {
  try {
    const requestingUser = (req as any).user;
    const user = await authService.createUser(req.body, requestingUser);
    return res.status(201).json({
      message: "User created successfully", user,
    });
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const userId = parseInt((req.params.id) as string, 10);
    const userJwt = (req as any).user;
    if (userId === userJwt.id) {
      return res.status(400).json({ message: "You cannot delete your own account" });
    }
    await authService.deleteUser(userId);
    return res.status(204).send();
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};
export const updateUser = async (req: Request, res: Response) => {
  try {
    const user = await authService.updateUser(req.body);
    return res.status(200).json({
      message: "User updated successfully", user,
    });
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};
export const login = async (req: Request, res: Response) => {
  try {
    const { username, password, rememberMe } = req.body;
    const result = await authService.login(username, password);
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // chỉ gửi qua HTTPS khi production
      sameSite: "strict",
      ...(rememberMe ? { maxAge: getCookieMaxAge() } : {}),
    });
    return res.status(200).json({
      message: "Login successful",
      token: result.token,
    });
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};
export const refresh = async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({ message: "No refresh token provided" });
  }
  try {
    const decoded = (await import("../../../core/utils/jwt")).verifyRefreshToken(refreshToken);
    if (!decoded) return res.status(401).json({ message: "Invalid or expired refresh token" });

    // Fetch fresh role + company_id from DB to avoid stale JWT data
    const user = await model.User.findByPk(decoded.id, {
      include: [
        { model: model.Role, as: "role", attributes: ["code"] },
        { model: model.Branch, as: "branch", attributes: ["id", "company_id"] },
      ],
      attributes: ["id", "username", "full_name", "email", "branch_id", "role_id", "is_active"],
    }) as any;

    if (!user || !user.is_active) return res.status(401).json({ message: "User not found or inactive" });

    const { RolePermission } = await import("../models/rolePermission.model");
    const { Permission } = await import("../models/permission.model");
    const rolePerms = user.role_id ? await RolePermission.findAll({
      where: { role_id: user.role_id },
      include: [{ model: Permission, as: "permission", attributes: ["code"] }],
    }) : [];
    const permissions = rolePerms.map((rp: any) => rp.permission?.code).filter(Boolean);

    const { generateAccessToken } = await import("../../../core/utils/jwt");
    const newPayload: import("../../../core/types/jwt").JwtPayload = {
      id: user.id,
      username: user.username,
      role: user.role?.code ?? "UNKNOWN",
      permissions,
      ...(user.full_name ? { fullName: user.full_name } : {}),
      ...(user.email ? { email: user.email } : {}),
      ...(user.branch_id ? { branch_id: user.branch_id } : {}),
      ...(user.branch?.company_id ? { company_id: user.branch.company_id } : {}),
    };
    const newAccessToken = generateAccessToken(newPayload);
    return res.json({ accessToken: newAccessToken });
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired refresh token" });
  }
};

export const clearRefreshToken = (req: Request, res: Response) => {
  try {
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",

    });
    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Logout failed" });
  }
}

export const requestPasswordReset = async (req: Request, res: Response) => {
  try {
    const { username } = req.body;
    const result = await authService.requestPasswordReset(username);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const validateResetToken = async (req: Request, res: Response) => {
  try {
    const { token } = req.query;
    const result = await authService.validateResetToken(token as string);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;
    const result = await authService.resetPassword(token, newPassword);
    res.status(200).json(result);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};
export const getInforUser = async (req: Request, res: Response) => {
  try {
    const userJwt = (req as any).user;
    if (!userJwt) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const user = await authService.getInforUser(userJwt.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
}

export const updateUserAvatar = async (req: Request, res: Response) => {
  try {
    const userJwt = (req as any).user;
    if (!userJwt) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const result = await authService.updateUserAvatar(userJwt.id, req.file.buffer);
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Update avatar failed" });
  }
}
export const updateUserInfo = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { full_name, email, phone } = req.body;
    const result = await authService.updateUserInfo(user.id, { full_name, email, phone });
    res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Update info failed" });
  }
}

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const userJwt = (req as any).user;
    let companyId: number | undefined = userJwt?.company_id;

    // Fallback: nếu JWT cũ không có company_id, lấy từ DB qua branch
    if (!companyId && userJwt?.branch_id) {
      const branch = await model.Branch.findByPk(userJwt.branch_id, { attributes: ['company_id'] });
      companyId = (branch as any)?.company_id ?? undefined;
    }

    const users = await authService.getAllUsers(companyId);
    return res.status(200).json(users);
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};
export const getAllRoles = async (req: Request, res: Response) => {
  try {
    const roles = await authService.getAllRoles();
    return res.status(200).json(roles);
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};
// ✅ API trả về thông tin user + employee_id cho màn chấm công cá nhân
export const getMeAttendance = async (req: Request, res: Response) => {
  try {
    const userJwt = (req as any).user;
    if (!userJwt) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await authService.getUserForAttendance(userJwt.id);
    return res.json(user);
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};
