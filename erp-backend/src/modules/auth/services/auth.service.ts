import { hashPassword } from "../../../core/utils/security";
import * as model from "../../../models/index";
import { JwtPayload } from "../../../core/types/jwt";
import jwt from "jsonwebtoken";
import { env } from "../../../config/env";

export async function createUser(data: {
  branch_id: number;
  username: string;
  password: string;
  full_name?: string;
  email?: string;
  phone?: string;
  roleCodes?: string[];
}) {
  const hash = await hashPassword(data.password);

  const user = await model.User.create({
    branch_id: data.branch_id,
    username: data.username,
    password_hash: hash,
    ...(data.full_name ? { full_name: data.full_name } : {}),
    ...(data.email ? { email: data.email } : {}),
    ...(data.phone ? { phone: data.phone } : {}),
    is_active: true,
  });

  if (data.roleCodes?.length) {
    const roles = await model.Role.findAll({ where: { code: data.roleCodes } });
    for (const role of roles) {
      await model.UserRole.create({ user_id: user.id, role_id: role.id });
    }
  }

  return user;
}
