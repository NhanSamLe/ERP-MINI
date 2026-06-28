import axiosClient from "../../../api/axiosClient";

export const getSalesDashboardData = (params?: any) => {
  return axiosClient.get("/sales/dashboard", { params });
};

export const exportSalesDashboardExcel = (params?: any) => {
  return axiosClient.get("/sales/dashboard/export", {
    params,
    responseType: "blob",
  });
};
