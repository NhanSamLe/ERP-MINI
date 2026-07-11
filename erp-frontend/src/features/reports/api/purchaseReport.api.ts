import axiosClient from "../../../api/axiosClient";

export interface PurchaseDashboardStats {
  stats: {
    total_spend: number;
    pending_approval_count: number;
    total_orders_count: number;
    active_suppliers_count: number;
  };
  trends: Array<{
    month: string;
    total: number;
    count: number;
  }>;
  statusDistribution: Array<{
    status: string;
    count: number;
  }>;
  topSuppliers: Array<{
    id: number;
    name: string;
    email: string;
    phone: string;
    total_spend: number;
    count: number;
  }>;
  recentOrders: Array<{
    id: number;
    po_no: string;
    order_date: string;
    status: string;
    total_after_tax: number;
    supplier?: {
      id: number;
      name: string;
    };
  }>;
}

export const purchaseReportApi = {
  getDashboardStats: async (params?: { fromMonth?: string; toMonth?: string }): Promise<PurchaseDashboardStats> => {
    const res = await axiosClient.get("/reports/purchase/dashboard-stats", { params });
    return res.data;
  },
};
