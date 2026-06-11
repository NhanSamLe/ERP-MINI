import { physicalInventoryApi } from "../api/physicalInventory.api";
import {
  PhysicalInventory,
  PhysicalInventoryLine,
  CreateInventoryDTO,
  AddInventoryLineDTO,
} from "../store/stock/physicalInventory/physicalInventory.types";

export const physicalInventoryService = {
  async getAll(): Promise<PhysicalInventory[]> {
    return physicalInventoryApi.getAll();
  },

  async getById(id: number): Promise<PhysicalInventory> {
    return physicalInventoryApi.getById(id);
  },

  async create(data: CreateInventoryDTO): Promise<PhysicalInventory> {
    return physicalInventoryApi.create(data);
  },

  async start(id: number): Promise<PhysicalInventory> {
    return physicalInventoryApi.start(id);
  },

  async addLine(
    id: number,
    data: AddInventoryLineDTO,
  ): Promise<PhysicalInventoryLine> {
    return physicalInventoryApi.addLine(id, data);
  },

  async updateLine(
    id: number,
    lineId: number,
    counted_qty: number,
  ): Promise<PhysicalInventoryLine> {
    return physicalInventoryApi.updateLine(id, lineId, counted_qty);
  },

  async validate(id: number): Promise<PhysicalInventory> {
    return physicalInventoryApi.validate(id);
  },

  async submit(id: number): Promise<PhysicalInventory> {
    return physicalInventoryApi.submit(id);
  },

  async approve(id: number): Promise<PhysicalInventory> {
    return physicalInventoryApi.approve(id);
  },

  async reject(id: number, reject_reason: string): Promise<PhysicalInventory> {
    return physicalInventoryApi.reject(id, reject_reason);
  },

  async cancel(id: number): Promise<PhysicalInventory> {
    return physicalInventoryApi.cancel(id);
  },
};
