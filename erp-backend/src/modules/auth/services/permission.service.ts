import { Permission } from "../models/permission.model";
import { RolePermission } from "../models/rolePermission.model";
import { Role } from "../models/role.model";
import { Op } from "sequelize";

export const permissionService = {
  /** Lấy tất cả permissions */
  async getAllPermissions(search?: string) {
    const where: any = {};
    if (search) {
      where[Op.or] = [
        { code: { [Op.like]: `%${search}%` } },
        { name: { [Op.like]: `%${search}%` } },
        { module: { [Op.like]: `%${search}%` } },
      ];
    }
    return Permission.findAll({ where, order: [["module", "ASC"], ["code", "ASC"]] });
  },

  /** Lấy permissions grouped by module */
  async getPermissionsGrouped() {
    const perms = await Permission.findAll({ order: [["module", "ASC"], ["code", "ASC"]] });
    const grouped: Record<string, typeof perms> = {};
    for (const p of perms) {
      if (!grouped[p.module]) grouped[p.module] = [];
      grouped[p.module]!.push(p);
    }
    return grouped;
  },

  /** Lấy permissions của 1 role */
  async getPermissionsByRole(roleId: number) {
    const role = await Role.findByPk(roleId);
    if (!role) throw new Error("Role not found");

    const rolePerms = await RolePermission.findAll({
      where: { role_id: roleId },
      include: [{ model: Permission, as: "permission" }],
    });
    return rolePerms.map((rp: any) => rp.permission).filter(Boolean);
  },

  /** Gán nhiều permissions cho 1 role (replace all) */
  async assignPermissionsToRole(roleId: number, permissionIds: number[]) {
    const role = await Role.findByPk(roleId);
    if (!role) throw new Error("Role not found");

    // Verify all permission IDs exist
    const existingPerms = await Permission.findAll({
      where: { id: { [Op.in]: permissionIds } },
    });
    if (existingPerms.length !== permissionIds.length) {
      throw new Error("Some permission IDs are invalid");
    }

    // Delete existing role_permissions for this role
    await RolePermission.destroy({ where: { role_id: roleId } });

    // Create new mappings
    if (permissionIds.length > 0) {
      const rows = permissionIds.map((pid) => ({
        role_id: roleId,
        permission_id: pid,
      }));
      await RolePermission.bulkCreate(rows);
    }

    return this.getPermissionsByRole(roleId);
  },

  /** Thêm 1 permission cho role */
  async addPermissionToRole(roleId: number, permissionId: number) {
    const [role, perm] = await Promise.all([
      Role.findByPk(roleId),
      Permission.findByPk(permissionId),
    ]);
    if (!role) throw new Error("Role not found");
    if (!perm) throw new Error("Permission not found");

    const existing = await RolePermission.findOne({
      where: { role_id: roleId, permission_id: permissionId },
    });
    if (existing) throw new Error("Permission already assigned to this role");

    await RolePermission.create({ role_id: roleId, permission_id: permissionId });
    return this.getPermissionsByRole(roleId);
  },

  /** Xóa 1 permission khỏi role */
  async removePermissionFromRole(roleId: number, permissionId: number) {
    const deleted = await RolePermission.destroy({
      where: { role_id: roleId, permission_id: permissionId },
    });
    if (deleted === 0) throw new Error("Permission not found for this role");
    return this.getPermissionsByRole(roleId);
  },
};
