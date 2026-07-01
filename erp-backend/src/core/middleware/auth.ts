import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JwtPayload } from "../types/jwt";
import { env } from "../../config/env";
export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export const authMiddleware = (requiredRoles: string[]) => (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ message: "No token provided" });

  const token = authHeader.split(" ")[1];
  if (!token) {
  return res.status(401).json({ message: "Token not found" });
  }
  try {
    const decoded = jwt.verify(token, env.jwt.secret);
      console.log("DECODED TOKEN --->", decoded);
     if (typeof decoded === 'object' && decoded !== null && 'id' in decoded && 'role' in decoded) {
       const userRole = (decoded as any).role;
       const rolesToCheck = [userRole];
       if (userRole === "HRMANAGER") rolesToCheck.push("HR_STAFF");
       if (userRole === "HR_STAFF") rolesToCheck.push("HRMANAGER");
       if (userRole === "CHACC") rolesToCheck.push("CHIEF_ACCOUNTANT");
       if (userRole === "CHIEF_ACCOUNTANT") rolesToCheck.push("CHACC");

       const isAdmin = userRole === "ADMIN";
       const hasPermission = isAdmin || !requiredRoles || requiredRoles.length === 0 || requiredRoles.some(r => rolesToCheck.includes(r));

       if (!hasPermission) {
           return res.status(403).json({ message: "Forbidden: insufficient role" });
       }
       req.user = decoded as JwtPayload;
       next();
    } else {
      return res.status(401).json({ message: "Invalid token format" });
    }
  } catch (err: any) {
   if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }
    return res.status(401).json({ message: "Invalid token" });
  }
}