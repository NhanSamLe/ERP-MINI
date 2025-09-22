import bcrypt from "bcryptjs";
import crypto from "crypto";
/**
 * Hash password
 */
export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, 10);
};

/**
 * So sánh password với hash
 */
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

/**
 * Sinh OTP ngẫu nhiên
 */
export const generateOtp = (length = 6): string => {
  return crypto.randomInt(0, Math.pow(10, length)).toString().padStart(length, "0");
};

