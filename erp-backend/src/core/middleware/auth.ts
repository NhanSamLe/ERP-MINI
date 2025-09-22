import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JwtPayload } from "../types/jwt";
import { env } from "../../config/env";
export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ message: "No token provided" });

  const token = authHeader.split(" ")[1];
  if (!token) {
  return res.status(401).json({ message: "Token not found" });
}
  try {
    const decoded = jwt.verify(token, env.jwt.secret);
     if (typeof decoded === 'object' && decoded !== null && 'id' in decoded && 'role' in decoded) {
      req.user = decoded as JwtPayload;
      next();
    } else {
      return res.status(401).json({ message: "Invalid token format" });
    }
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}