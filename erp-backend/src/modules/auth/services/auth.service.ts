import { hashPassword, comparePassword } from "../../../core/utils/security";
import * as model from "../../../models/index";
import { JwtPayload } from "../../../core/types/jwt";
import { generateAccessToken, generateRefreshToken } from "../../../core/utils/jwt";  
import { UserWithRole } from "../../../core/types/User";
import crypto from "crypto";
import { sendEmail , resetPasswordTemplate} from "../../../core/utils/email";
import { uploadBufferToCloudinary, deleteFromCloudinary } from "../../../core/utils/uploadCloudinary";

export async function createUser(data: {
  branch_id: number;
  username: string;
  password: string;
  full_name?: string;
  email?: string;
  phone?: string;
  role_id: number;
}) {
  const role = await model.Role.findOne({ where: { id: data.role_id } });
  if (!role) {
    throw new Error("Invalid role ID  provided");
  }
  const hash = await hashPassword(data.password);
  const user = await model.User.create({
    branch_id: data.branch_id,
    username: data.username,
    password_hash: hash,
    ...(data.full_name ? { full_name: data.full_name } : {}),
    ...(data.email ? { email: data.email } : {}),
    ...(data.phone ? { phone: data.phone } : {}),
    role_id: data.role_id,
    is_active: false,
  });
  await user.save();
  return user;
}

export async function login(username: string, password: string) {
  const user = await model.User.findOne({ where: { username } , include: [{ model: model.Role, as: "role" }],})as UserWithRole; ;
  if (!user) {
    throw new Error("User not found");
  }
  const isValid = await comparePassword(password, user.password_hash);
  if (!isValid) {
    throw new Error("Invalid password");
  }
  const payload: JwtPayload = {
    id: user.id,
    username: user.username,
    role: user.role?.code ?? "UNKNOWN",
    ...(user.full_name ? { fullName: user.full_name } : {}),
    ...(user.email ? { email: user.email } : {}),
    ...(user.branch_id ? { branchId: user.branch_id.toString() } : {}),
  };
  const token = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);
  return { token, refreshToken };
}
// Tạo và gửi token để reset
export async function requestPasswordReset(username: string) {
  const user = await model.User.findOne({
    where:  { username: username },
  });
  if (!user) throw new Error("User not found");
  const token = crypto.randomBytes(32).toString("hex");
  user.reset_token = token;
  user.reset_expires_at = new Date(Date.now() + 10 * 60 * 1000); // 10 phút
  await user.save();
  const resetLink = `http://localhost:3000/reset-password?token=${token}`;
  const template = resetPasswordTemplate(user.username, resetLink);
  await sendEmail(user.email!, template.subject, template.text, template.html);
  return { message: "Reset link sent to email" };
}

// Validate token khi user click link
export async function validateResetToken(token: string) {
  const user = await model.User.findOne({ where: { reset_token: token } });
  if (!user || !user.reset_expires_at || user.reset_expires_at < new Date()) {
    throw new Error("Invalid or expired token");
  }
  return { valid: true, userId: user.id };
}

// Đổi mật khẩu
export async function resetPassword(token: string, newPassword: string) {
  const user = await model.User.findOne({ where: { reset_token: token } });
  if (!user || !user.reset_expires_at || user.reset_expires_at < new Date()) {
    throw new Error("Invalid or expired token");
  }
  user.password_hash = await hashPassword(newPassword);
  user.reset_token = null;
  user.reset_expires_at = null;
  await user.save();
  return { message: "Password updated successfully" };
}

export async function getInforUser(userId: number) {
 const user = await model.User.findByPk(userId, {
      include: [{ model: model.Role, as: "role" } ,{ model: model.Branch, as: "branch" ,attributes: ["id","code","name","address"],},],
      attributes: ["id", "username", "full_name", "email", "phone","avatar_url"],
    });
  if (!user) {
    throw new Error("User not found");
  }
  return user ; 
}

export async function updateUserAvatar(userId: number, buffer: Buffer) {
  const user = await model.User.findByPk(userId);
  if (!user) {
    throw new Error("User not found");
  }
  if (user.avatar_public_id) {
  try {
    await deleteFromCloudinary(user.avatar_public_id);
  } catch (err) {
    console.warn("Old avatar not found in Cloudinary", err);
  }
}
  const result = await uploadBufferToCloudinary(buffer, "avatars");
  user.avatar_url = result.url;
  user.avatar_public_id = result.public_id;
  await user.save();

  return { message: "Avatar updated successfully", avatar_url: user.avatar_url };
}

export async function updateUserInfo(
  userId: number,
  data: { full_name?: string; email?: string; phone?: string }
) {
  const user = await model.User.findByPk(userId, {
      include: [{ model: model.Role, as: "role" } ,{ model: model.Branch, as: "branch" ,attributes: ["id","code","name","address"],},],
      attributes: ["id", "username", "full_name", "email", "phone","avatar_url"],
    });
  if (!user) throw new Error("User not found");

  if (data.full_name !== undefined) user.full_name = data.full_name;
  if (data.email !== undefined) user.email = data.email;
  if (data.phone !== undefined) user.phone = data.phone;

  await user.save();
  return { message: "User info updated successfully", user };
}



