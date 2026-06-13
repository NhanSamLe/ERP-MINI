import { hashPassword, comparePassword } from "../../../core/utils/security";
import * as model from "../../../models/index";
import { JwtPayload } from "../../../core/types/jwt";
import { generateAccessToken, generateRefreshToken } from "../../../core/utils/jwt";  
import { UserWithRole } from "../../../core/types/User";
import crypto from "crypto";
import { sendEmail , resetPasswordTemplate,newEmployeeAccountTemplate} from "../../../core/utils/email";
import { uploadBufferToCloudinary, deleteFromCloudinary } from "../../../core/utils/uploadCloudinary";
import { Op } from "sequelize";
import {getRelations, hasLinkedData} from "../../../core/utils/getRelation";
import{env} from "../../../config/env"
import { RolePermission } from "../models/rolePermission.model";
import { Permission } from "../models/permission.model";

// Helper: Load tất cả permission codes cho 1 role
async function loadUserPermissions(roleId: number): Promise<string[]> {
  const rolePerms = await RolePermission.findAll({
    where: { role_id: roleId },
    include: [{ model: Permission, as: "permission", attributes: ["code"] }],
  });
  return rolePerms
    .map((rp: any) => rp.permission?.code)
    .filter(Boolean);
}
export async function createUser(
  data: {
    branch_id: number;
    username: string;
    password: string;
    full_name?: string;
    email?: string;
    phone?: string;
    role_id: number;
	employee_id?: number;
  },
  requestingUser?: { company_id?: number },
) {
  const [role, checkUser, checkPhone, checkEmail, branch] = await Promise.all([
    model.Role.findOne({ where: { id: data.role_id } }),
    model.User.findOne({ where: { username: data.username } }),
    data.phone ? model.User.findOne({ where: { phone: data.phone } }) : Promise.resolve(null),
    data.email ? model.User.findOne({ where: { email: data.email } }) : Promise.resolve(null),
    model.Branch.findByPk(data.branch_id, { attributes: ["id", "company_id"] }),
  ]);
	 if (data.employee_id) checks.push(model.User.findOne({ where: { employee_id: data.employee_id } }));
  const results = await Promise.all(checks);
  const role = results[0];
  const checkUser = results[1];
  
  let checkPhone = null;
  let checkEmail = null;
  let checkEmp = null;
  let idx = 2;
  if (data.phone) checkPhone = results[idx++];
  if (data.email) checkEmail = results[idx++];
  if (data.employee_id) checkEmp = results[idx++];

  if (!role) throw new Error("Invalid role ID provided");
  if (checkUser) throw new Error("Username already exists");
  if (data.email && checkEmail) throw new Error("Email already exists");
  if (data.phone && checkPhone) throw new Error("Phone number already exists");
  if (data.employee_id && checkEmp) throw new Error("Nhân viên này đã được liên kết với một tài khoản khác.");

  // Bảo vệ multi-tenant: branch phải thuộc cùng company với người tạo
  if (!branch) throw new Error("Branch not found");
  if (requestingUser?.company_id && (branch as any).company_id !== requestingUser.company_id) {
    throw new Error("Cannot create user for a branch belonging to a different company");
  }

  const hash = await hashPassword(data.password);
  const resetToken = crypto.randomBytes(32).toString("hex");
  const user = await model.User.create({
    branch_id: data.branch_id,
    username: data.username,
    password_hash: hash,
    ...(data.full_name ? { full_name: data.full_name } : {}),
    ...(data.email ? { email: data.email } : {}),
    ...(data.phone ? { phone: data.phone } : {}),
    role_id: data.role_id,
    is_active: false,
    reset_token: resetToken,
    reset_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
    employee_id: data.employee_id || null,
  });
  await user.save();
  if (user.email) {
    const resetLink = `${env.frontend.url}/reset-password?token=${resetToken}`;
    const template = newEmployeeAccountTemplate(
    user.username,
    user.full_name,
    resetLink
  );

  await sendEmail(
    user.email!,
    template.subject,
    template.text,
    template.html
  );
  }
  await user.reload({
  attributes: { exclude: ["password_hash"] },
  include: [
    {
        model: model.Role,
        as: "role",
        required: true,
        attributes: ["id","code","name"], 
      },
      {
        model: model.Branch,
        as: "branch",
        attributes: ["id","code","name","address"],
      }
  ],
});
  return user;
}
export async function getAllUsers(companyId?: number) {
  if (!companyId) return [];

  const users = await model.User.findAll({
    attributes: { exclude: ["password_hash", "reset_token", "reset_expires_at"] },
    include: [
      {
        model: model.Role,
        as: "role",
        required: true,
        attributes: ["id", "code", "name"],
      },
      {
        model: model.Branch,
        as: "branch",
        required: true,
        where: { company_id: companyId },
        attributes: ["id", "code", "name", "address"],
      },
    ],
    order: [["id", "DESC"]],
  });
  return users;
}
export async function getAllRoles(){
  const roles = await model.Role.findAll({where: { name: { [Op.ne]: "ADMIN" } }, attributes: ["id","code","name"]});
  return roles;
}

export async function updateUser(data: {
  username?: string;
  branch_id: number;
  full_name?: string;
  email?: string;
  phone?: string;
  role_id: number;
  is_active?: boolean;
}){
  const user = await model.User.findOne({ where: { username: data.username } });
  if (!user) throw new Error("User not found");
  if (data.role_id) {
    const role = await model.Role.findByPk(data.role_id);
    if (!role) throw new Error("Invalid role ID provided");
  }
   if (data.phone || data.email) {
    const existing = await model.User.findOne({
      where: {
        [Op.or]: [
          data.phone ? { phone: data.phone } : {},
          data.email ? { email: data.email } : {},
        ],
        id: { [Op.ne]: user.id }, // bỏ qua chính user đang update
      },
    });

    if (existing) {
      if (existing.phone === data.phone) throw new Error("Phone number already exists");
      if (existing.email === data.email) throw new Error("Email already exists");
    }
    await user.update({
    ...(data.branch_id ? { branch_id: data.branch_id } : {}),
    ...(data.full_name ? { full_name: data.full_name } : {}),
    ...(data.email ? { email: data.email } : {}),
    ...(data.phone ? { phone: data.phone } : {}),
    ...(data.role_id ? { role_id: data.role_id } : {}),
    ...(data.is_active !== undefined ? { is_active: data.is_active } : {}),
   });
  }
  await user.reload({
  attributes: { exclude: ["password_hash"] },
  include: [
    {
        model: model.Role,
        as: "role",
        required: true,
        attributes: ["id","code","name"], 
      },
      {
        model: model.Branch,
        as: "branch",
        attributes: ["id","code","name","address"],
      }
  ],
  });
  return user;
}

export async function deleteUser(id: number) {
  const user = await model.User.findByPk(id);
  if (!user) {
    throw new Error("Không tìm thấy tài khoản người dùng.");
  }
   const linked = await hasLinkedData(model.User, id);
  if (linked) {
    throw new Error(
      "Tài khoản này đang được liên kết với dữ liệu nghiệp vụ. Hãy sử dụng chức năng ‘Ngưng hoạt động’ thay vì xóa."
    );
  }
  await user.destroy(); 
}

async function hasUserLinkedData(userId: number) {
  const linkedCounts = await Promise.all([
    model.Lead.count({ where: { assigned_to: userId } }),
    model.Opportunity.count({ where: { owner_id: userId } }),
    model.Activity.count({ where: { owner_id: userId } }),
  ]);

  const totalLinked = linkedCounts.reduce((a, b) => a + b, 0);
  return totalLinked > 0;
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
  if (!user.is_active) {
    throw new Error("Account is not activated. Please set your password.");
  }

  // Load permissions và company_id (từ branch) cho multi-tenant isolation
  const [permissions, branch] = await Promise.all([
    user.role_id ? loadUserPermissions(user.role_id) : Promise.resolve([]),
    user.branch_id ? model.Branch.findByPk(user.branch_id, { attributes: ["id", "company_id"] }) : Promise.resolve(null),
  ]);

  const payload: JwtPayload = {
    id: user.id,
    username: user.username,
    role: user.role?.code ?? "UNKNOWN",
    permissions,
    ...(user.full_name ? { fullName: user.full_name } : {}),
    ...(user.email ? { email: user.email } : {}),
    ...(user.branch_id ? { branch_id: user.branch_id } : {}),
    ...((branch as any)?.company_id ? { company_id: (branch as any).company_id } : {}),
  };
  const token = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  const isSetupDone = (branch as any)?.company_id
    ? await model.Company.findByPk((branch as any).company_id, { attributes: ['is_setup_done'] }).then(c => c?.is_setup_done ?? false)
    : true;

  return { token, refreshToken, is_setup_done: isSetupDone };
}
// Tạo và gửi token để reset
export async function requestPasswordReset(username: string) {
  const user = await model.User.findOne({
    where:  { username: username },
  });
  if (!user) throw new Error("User not found");
  if (!user.is_active) {
    throw new Error("Account is inactive or not activated");
  }
  const token = crypto.randomBytes(32).toString("hex");
  user.reset_token = token;
  user.reset_expires_at = new Date(Date.now() + 10 * 60 * 1000); // 10 phút
  await user.save();
  const resetLink = `${env.frontend.url}/reset-password?token=${token}`;
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
  user.is_active = true;
  await user.save();
  return { message: "Password updated successfully" };
}

export async function getInforUser(userId: number) {
 const user = await model.User.findByPk(userId, {
      include: [{ model: model.Role, as: "role" } ,{ model: model.Branch, as: "branch" ,attributes: ["id","code","name","address"],},],
      attributes: ["id", "username", "full_name", "email", "phone","avatar_url", "is_active"],
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
// ✅ DÙNG CHO CHẤM CÔNG 
export async function getUserForAttendance(userId: number) {
   const user = await model.User.findByPk(userId, {
    include: [
      { model: model.Role, as: "role" },
      {
        model: model.Branch,
        as: "branch",
        attributes: ["id", "code", "name", "address"],
      },
    ],
    attributes: [
      "id",
      "username",
      "full_name",
      "email",
      "phone",
      "avatar_url",
      "is_active",
      "employee_id",
      "branch_id",
    ],
  });

  if (!user) {
    throw new Error("User not found");
  }
  return user;
}



