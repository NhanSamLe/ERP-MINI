import { Response } from "express";
import { AuthRequest } from "../../../core/middleware/auth";
import { permissionService } from "../services/permission.service";

export const permissionController = {
  /** GET /api/auth/permissions */
  async getAll(req: AuthRequest, res: Response) {
    try {
      const { search } = req.query;
      const permissions = await permissionService.getAllPermissions(search as string);
      res.json({ message: "Permissions retrieved successfully", data: permissions });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },

  /** GET /api/auth/permissions/grouped */
  async getGrouped(req: AuthRequest, res: Response) {
    try {
      const grouped = await permissionService.getPermissionsGrouped();
      res.json({ message: "Permissions grouped by module", data: grouped });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },

  /** GET /api/auth/roles/:roleId/permissions */
  async getByRole(req: AuthRequest, res: Response) {
    try {
      const roleId = Number(req.params.roleId);
      const permissions = await permissionService.getPermissionsByRole(roleId);
      res.json({ message: "Role permissions retrieved", data: permissions });
    } catch (err: any) {
      const status = err.message.includes("not found") ? 404 : 500;
      res.status(status).json({ message: err.message });
    }
  },

  /** PUT /api/auth/roles/:roleId/permissions — Replace all permissions for a role */
  async assignToRole(req: AuthRequest, res: Response) {
    try {
      const roleId = Number(req.params.roleId);
      const { permission_ids } = req.body;
      if (!Array.isArray(permission_ids)) {
        return res.status(400).json({ message: "permission_ids must be an array" });
      }
      const permissions = await permissionService.assignPermissionsToRole(roleId, permission_ids);
      res.json({ message: "Permissions assigned successfully", data: permissions });
    } catch (err: any) {
      const status = err.message.includes("not found") ? 404 : 400;
      res.status(status).json({ message: err.message });
    }
  },

  /** POST /api/auth/roles/:roleId/permissions — Add single permission */
  async addToRole(req: AuthRequest, res: Response) {
    try {
      const roleId = Number(req.params.roleId);
      const { permission_id } = req.body;
      if (!permission_id) {
        return res.status(400).json({ message: "permission_id is required" });
      }
      const permissions = await permissionService.addPermissionToRole(roleId, Number(permission_id));
      res.json({ message: "Permission added to role", data: permissions });
    } catch (err: any) {
      const status = err.message.includes("not found") ? 404 : 400;
      res.status(status).json({ message: err.message });
    }
  },

  /** DELETE /api/auth/roles/:roleId/permissions/:permissionId */
  async removeFromRole(req: AuthRequest, res: Response) {
    try {
      const roleId = Number(req.params.roleId);
      const permissionId = Number(req.params.permissionId);
      const permissions = await permissionService.removePermissionFromRole(roleId, permissionId);
      res.json({ message: "Permission removed from role", data: permissions });
    } catch (err: any) {
      const status = err.message.includes("not found") ? 404 : 400;
      res.status(status).json({ message: err.message });
    }
  },
};
