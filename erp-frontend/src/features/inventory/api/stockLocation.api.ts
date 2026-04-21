import axiosClient from "../../../api/axiosClient";

export type StockLocationType =
  | "view"
  | "internal"
  | "input"
  | "output"
  | "customer"
  | "supplier"
  | "transit";

export interface StockLocation {
  id: number;
  warehouse_id: number;
  parent_id?: number | null;
  name: string;
  code: string;
  type: StockLocationType;
  is_active: boolean;
  path?: string | null;
  children?: StockLocation[];
  warehouse?: { id: number; name: string; code: string };
  parent?: { id: number; name: string; code: string; path: string };
}

export interface CreateLocationDTO {
  warehouse_id: number;
  parent_id?: number | null;
  name: string;
  code: string;
  type: StockLocationType;
  is_active?: boolean;
}

export interface UpdateLocationDTO {
  parent_id?: number | null;
  name?: string;
  type?: StockLocationType;
  is_active?: boolean;
}

export const stockLocationApi = {
  getAll: async (warehouseId: number): Promise<StockLocation[]> => {
    const res = await axiosClient.get("/locations", {
      params: { warehouseId },
    });
    return res.data;
  },

  getTree: async (warehouseId: number): Promise<StockLocation[]> => {
    const res = await axiosClient.get("/locations/tree", {
      params: { warehouseId },
    });
    return res.data;
  },

  getById: async (id: number): Promise<StockLocation> => {
    const res = await axiosClient.get(`/locations/${id}`);
    return res.data;
  },

  getByType: async (
    warehouseId: number,
    type: StockLocationType,
  ): Promise<StockLocation[]> => {
    const res = await axiosClient.get("/locations/by-type", {
      params: { warehouseId, type },
    });
    return res.data;
  },

  create: async (data: CreateLocationDTO): Promise<StockLocation> => {
    const res = await axiosClient.post("/locations", data);
    return res.data;
  },

  update: async (
    id: number,
    data: UpdateLocationDTO,
  ): Promise<StockLocation> => {
    const res = await axiosClient.put(`/locations/${id}`, data);
    return res.data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosClient.delete(`/locations/${id}`);
  },
};
