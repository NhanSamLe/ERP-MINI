import { organizationApi } from "../api/organization.api";
import { OrganizationChartDTO } from "../dto/organization.dto";

export async function fetchOrganizationChart(
  branchId: number
): Promise<OrganizationChartDTO> {
  return organizationApi.getChart(branchId);
}
