import apiClient from "../../../api/axiosClient";
import { OrganizationChartDTO } from "../dto/organization.dto";

export const organizationApi = {
  async getChart(branchId?: number) {
    if (!branchId) throw new Error("branchId is required");
    console.log("📡 Call API /hrm/organization with branchId:", branchId);
    const url = branchId
      ? `/hrm/organization/${branchId}`   // CEO
      : `/hrm/organization`;             // Manager
    const res = await apiClient.get<OrganizationChartDTO>(url);
    return res.data;
  },
};
