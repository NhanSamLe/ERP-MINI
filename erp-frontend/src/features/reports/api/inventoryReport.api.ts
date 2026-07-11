import axiosClient from "../../../api/axiosClient";

export interface StockSummaryItem {
  id: number;
  warehouse_id: number;
  product_id: number;
  location_id?: number | null;
  lot_id?: number | null;
  quantity: number;
  unit_cost?: number | null;
  total_value?: number | null;
  warehouse?: { id: number; name: string; code: string };
  product?: {
    id: number;
    name: string;
    sku: string;
    min_stock_qty?: number;
    uom?: { id: number; code: string; name: string };
    category?: { id: number; name: string };
  };
  location?: { id: number; name: string; code: string; type: string } | null;
  lot?: { id: number; lot_no: string; expiry_date?: string } | null;
}

export interface StockValuation {
  grand_total_value: number;
  by_category: Array<{
    category: string;
    total_value: number;
    total_qty: number;
  }>;
}

export interface DashboardStats {
  total_stock_value: number;
  low_stock_count: number;
  expiring_lots_count: number;
  pending_moves_count: number;
  trends?: Array<{
    month: string;
    receipts: number;
    issues: number;
  }>;
}

export interface ExpiringLot {
  id: number;
  lot_no: string;
  expiry_date: string;
  product?: { id: number; name: string; sku: string };
}

export const inventoryReportApi = {
  getDashboardStats: async (params?: { fromMonth?: string; toMonth?: string }): Promise<DashboardStats> => {
    const res = await axiosClient.get("/reports/inventory/dashboard-stats", { params });
    return res.data;
  },

  getStockSummary: async (params?: {
    warehouseId?: number;
    productId?: number;
    categoryId?: number;
  }): Promise<StockSummaryItem[]> => {
    const res = await axiosClient.get("/reports/inventory/stock-summary", {
      params,
    });
    return res.data;
  },

  getStockValuation: async (params?: {
    warehouseId?: number;
  }): Promise<StockValuation> => {
    const res = await axiosClient.get("/reports/inventory/stock-valuation", {
      params,
    });
    return res.data;
  },

  getLowStock: async (): Promise<StockSummaryItem[]> => {
    const res = await axiosClient.get("/reports/inventory/low-stock");
    return res.data;
  },

  getExpiringLots: async (params?: { days?: number; fromMonth?: string; toMonth?: string }): Promise<ExpiringLot[]> => {
    const res = await axiosClient.get("/reports/inventory/expiring-lots", {
      params,
    });
    return res.data;
  },

  getStockMovement: async (params?: {
    productId?: number;
    warehouseId?: number;
    from?: string;
    to?: string;
  }): Promise<any[]> => {
    const res = await axiosClient.get("/reports/inventory/stock-movement", {
      params,
    });
    return res.data;
  },
};
