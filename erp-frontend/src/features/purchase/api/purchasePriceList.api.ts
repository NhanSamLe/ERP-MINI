import axiosClient from "../../../api/axiosClient";

export interface PurchasePriceListItem {
  id: number;
  price_list_id: number;
  product_id: number;
  supplier_id?: number | null;
  min_quantity: number;
  unit_price: number;
  discount_percent: number;
  uom_id?: number | null;
  lead_time_days?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  product?: { id: number; name: string; image_url?: string };
}

export interface PurchasePriceList {
  id: number;
  name: string;
  code?: string | null;
  currency_id?: number | null;
  supplier_id?: number | null;
  is_active: boolean;
  start_date?: string | null;
  end_date?: string | null;
  notes?: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
  supplier?: { id: number; name: string };
  items?: PurchasePriceListItem[];
}

export interface EvaluatePriceResult {
  unit_price: number;
  discount_percent: number;
  lead_time_days: number | null;
  source: "price_list" | "supplier_info" | "cost_price";
  price_list_item_id: number | null;
}

export const purchasePriceListApi = {
  getAll: async (
    params?: Record<string, any>,
  ): Promise<PurchasePriceList[]> => {
    const res = await axiosClient.get("/purchase/price-lists", { params });
    return res.data.data;
  },

  getById: async (id: number): Promise<PurchasePriceList> => {
    const res = await axiosClient.get(`/purchase/price-lists/${id}`);
    return res.data.data;
  },

  create: async (
    body: Partial<PurchasePriceList>,
  ): Promise<PurchasePriceList> => {
    const res = await axiosClient.post("/purchase/price-lists", body);
    return res.data.data;
  },

  update: async (
    id: number,
    body: Partial<PurchasePriceList>,
  ): Promise<PurchasePriceList> => {
    const res = await axiosClient.put(`/purchase/price-lists/${id}`, body);
    return res.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosClient.delete(`/purchase/price-lists/${id}`);
  },

  addItems: async (
    id: number,
    items: Partial<PurchasePriceListItem>[],
  ): Promise<PurchasePriceListItem[]> => {
    const res = await axiosClient.post(`/purchase/price-lists/${id}/items`, {
      items,
    });
    return res.data.data;
  },

  updateItem: async (
    id: number,
    itemId: number,
    body: Partial<PurchasePriceListItem>,
  ): Promise<PurchasePriceListItem> => {
    const res = await axiosClient.put(
      `/purchase/price-lists/${id}/items/${itemId}`,
      body,
    );
    return res.data.data;
  },

  removeItem: async (id: number, itemId: number): Promise<void> => {
    await axiosClient.delete(`/purchase/price-lists/${id}/items/${itemId}`);
  },

  evaluatePrice: async (params: {
    product_id: number;
    supplier_id?: number;
    quantity?: number;
    price_list_id?: number;
    date?: string;
  }): Promise<EvaluatePriceResult> => {
    const res = await axiosClient.get("/purchase/price-lists/evaluate-price", {
      params,
    });
    return res.data.data;
  },
};
