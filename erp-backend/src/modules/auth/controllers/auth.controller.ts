import { Request, Response } from "express";
import * as authService from "../services/auth.service";
import {refreshAccessToken, getCookieMaxAge} from "../../../core/utils/jwt";
export const createUser = async (req: Request, res: Response) => {
  try {
    const user = await authService.createUser(req.body);
    return res.status(201).json({
      message: "User created successfully",
    });
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};
export const login = async (req: Request, res: Response) => {
  try {
    const { username, password, rememberMe} = req.body;
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
export const refresh = (req: Request, res: Response) => {
   const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({ message: "No refresh token provided" });
  }
    try {   
    const newAccessToken = refreshAccessToken(refreshToken);
    return res.json({ accessToken: newAccessToken });
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired refresh token" });
  }
};

export const clearRefreshToken =(req: Request, res: Response) => {
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
export const getInforUser =async  (req: Request, res: Response) => {
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

export const updateUserAvatar= async(req: Request, res: Response) =>{
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
export const updateUserInfo = async(req: Request, res: Response)=> {
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