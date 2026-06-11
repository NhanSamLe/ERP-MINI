import axiosClient from "../../../api/axiosClient";
import {
  PhysicalInventory,
  PhysicalInventoryLine,
  CreateInventoryDTO,
  AddInventoryLineDTO,
} from "../store/stock/physicalInventory/physicalInventory.types";

export const physicalInventoryApi = {
  getAll: async (): Promise<PhysicalInventory[]> => {
    const res = await axiosClient.get("/physical-inventories");
    return res.data;
  },

  getById: async (id: number): Promise<PhysicalInventory> => {
    const res = await axiosClient.get(`/physical-inventories/${id}`);
    return res.data;
  },

  create: async (data: CreateInventoryDTO): Promise<PhysicalInventory> => {
    const res = await axiosClient.post("/physical-inventories", data);
    return res.data;
  },

  start: async (id: number): Promise<PhysicalInventory> => {
    const res = await axiosClient.post(`/physical-inventories/${id}/start`);
    return res.data;
  },

  addLine: async (
    id: number,
    data: AddInventoryLineDTO,
  ): Promise<PhysicalInventoryLine> => {
    const res = await axiosClient.post(
      `/physical-inventories/${id}/lines`,
      data,
    );
    return res.data;
  },

  updateLine: async (
    id: number,
    lineId: number,
    counted_qty: number,
  ): Promise<PhysicalInventoryLine> => {
    const res = await axiosClient.patch(
      `/physical-inventories/${id}/lines/${lineId}`,
      { counted_qty },
    );
    return res.data;
  },

  validate: async (id: number): Promise<PhysicalInventory> => {
    const res = await axiosClient.post(`/physical-inventories/${id}/validate`);
    return res.data;
  },

  submit: async (id: number): Promise<PhysicalInventory> => {
    const res = await axiosClient.post(`/physical-inventories/${id}/submit`);
    return res.data;
  },

  approve: async (id: number): Promise<PhysicalInventory> => {
    const res = await axiosClient.post(`/physical-inventories/${id}/approve`);
    return res.data;
  },

  reject: async (id: number, reject_reason: string): Promise<PhysicalInventory> => {
    const res = await axiosClient.post(`/physical-inventories/${id}/reject`, {
      reject_reason,
    });
    return res.data;
  },

  cancel: async (id: number): Promise<PhysicalInventory> => {
    const res = await axiosClient.post(`/physical-inventories/${id}/cancel`);
    return res.data;
  },
};
