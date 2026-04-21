import axiosClient from "../../../api/axiosClient";

export interface StockLot {
  id: number;
  product_id: number;
  lot_no: string;
  serial_no?: string | null;
  manufacture_date?: string | null;
  expiry_date?: string | null;
  supplier_id?: number | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
  product?: { id: number; name: string; sku: string };
  supplier?: { id: number; name: string };
}

export interface CreateLotDTO {
  product_id: number;
  lot_no: string;
  serial_no?: string;
  manufacture_date?: string;
  expiry_date?: string;
  supplier_id?: number;
  notes?: string;
}

export interface UpdateLotDTO {
  serial_no?: string | null;
  manufacture_date?: string | null;
  expiry_date?: string | null;
  supplier_id?: number | null;
  notes?: string | null;
}

export const stockLotApi = {
  getAll: async (params?: {
    productId?: number;
    supplierId?: number;
  }): Promise<StockLot[]> => {
    const res = await axiosClient.get("/lots", { params });
    return res.data;
  },

  getById: async (id: number): Promise<StockLot> => {
    const res = await axiosClient.get(`/lots/${id}`);
    return res.data;
  },

  getByProduct: async (productId: number): Promise<StockLot[]> => {
    const res = await axiosClient.get(`/product/${productId}/lots`);
    return res.data;
  },

  getExpiring: async (days = 30): Promise<StockLot[]> => {
    const res = await axiosClient.get("/lots/expiring", { params: { days } });
    return res.data;
  },

  create: async (data: CreateLotDTO): Promise<StockLot> => {
    const res = await axiosClient.post("/lots", data);
    return res.data;
  },

  update: async (id: number, data: UpdateLotDTO): Promise<StockLot> => {
    const res = await axiosClient.put(`/lots/${id}`, data);
    return res.data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosClient.delete(`/lots/${id}`);
  },
};
