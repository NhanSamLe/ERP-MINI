import { Request, Response } from "express";
import * as authService from "../services/auth.service";
import {refreshAccessToken} from "../../../core/utils/jwt";
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
    const { username, password } = req.body;
    const result = await authService.login(username, password);
    return res.status(200).json({
      message: "Login successful",
      token: result.token,
      refreshToken: result.refreshToken,
    });
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};
export const refresh = (req: Request, res: Response) => {
  const { refreshToken } = req.body;
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
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};
