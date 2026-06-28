import * as api from "../api/salesDashboard.api";

export async function fetchSalesDashboard(params?: any): Promise<any> {
  const res = await api.getSalesDashboardData(params);
  return res.data.data;
}

export async function downloadSalesDashboardExcel(params?: any): Promise<Blob> {
  const res = await api.exportSalesDashboardExcel(params);
  return res.data;
}
