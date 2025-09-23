import { JwtPayload } from "../types/jwt";
import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "../../config/env";

export function generateAccessToken(payload: JwtPayload): string {
const options: jwt.SignOptions = {   expiresIn: env.jwt.expiresIn as any};
  return jwt.sign(payload, env.jwt.secret, options);
}
    
// Sinh refresh token
export function generateRefreshToken(payload: JwtPayload): string {
  const options: jwt.SignOptions = { expiresIn: env.jwt.refreshTokenExpiresIn as any || '7d' };
  return jwt.sign(payload, env.jwt.secret, options);
}

// Verify token bất kỳ (access hoặc refresh)
export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, env.jwt.secret);
    return decoded as JwtPayload;
  } catch (err) {
    return null;
  }
}

// Làm mới access token từ refresh token
export function refreshAccessToken(refreshToken: string): string | null {
  try {
    const decoded = jwt.verify(refreshToken, env.jwt.secret) as JwtPayload;
    return generateAccessToken({
      id: decoded.id,
      username: decoded.username,
      role: decoded.role,
        ...(decoded.fullName ? { fullName: decoded.fullName } : {}),
        ...(decoded.email ? { email: decoded.email } : {}),
        ...(decoded.branchId ? { branchId: decoded.branchId } : {}),
    });
  } catch (err) {
    return null;
  }
}