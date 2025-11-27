import { Request, Response } from "express";
import { organizationService } from "../services/organization.service";

export async function getOrganizationChart(req: Request, res: Response) {
  try {
    const userJwt = (req as any).user;

    if (!userJwt) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // 🔴 TẠM THỜI: luôn dùng branchId trên URL
    const paramBranchId = req.params.branchId;
    if (!paramBranchId) {
      return res.status(400).json({ message: "branchId is required" });
    }

    const branchId = Number(paramBranchId);
    if (Number.isNaN(branchId)) {
      return res.status(400).json({ message: "Invalid branchId" });
    }

    console.log("🔎 getOrganizationChart branchId =", branchId, "user.role =", userJwt.role);

    const data = await organizationService.getOrganizationChart(branchId);
    return res.json(data);
  } catch (error: any) {
    console.error("getOrganizationChart error:", error);
    return res.status(500).json({ message: error.message || "Server error" });
  }
}