import { Op } from "sequelize";
import {
  StockLocation,
  StockLocationType,
} from "../models/stockLocation.model";
import { Warehouse } from "../models/warehouse.model";
import { StockBalance } from "../models/stockBalance.model";
import { StockMoveLine } from "../models/stockMoveLine.model";
import { CreateLocationDTO, UpdateLocationDTO } from "../dto/stockLocation.dto";

export type { CreateLocationDTO, UpdateLocationDTO };

export const stockLocationService = {
  /** Danh sách phẳng theo warehouse */
  async getAll(warehouseId: number): Promise<StockLocation[]> {
    return StockLocation.findAll({
      where: { warehouse_id: warehouseId },
      include: [
        {
          model: Warehouse,
          as: "warehouse",
          attributes: ["id", "name", "code"],
        },
      ],
      order: [["path", "ASC"]],
    });
  },

  /** Dạng cây đệ quy */
  async getTree(warehouseId: number): Promise<StockLocation[]> {
    const all = await StockLocation.findAll({
      where: { warehouse_id: warehouseId },
      order: [["path", "ASC"]],
    });

    const map = new Map<number, any>();
    const roots: any[] = [];

    all.forEach((loc) => {
      map.set(Number(loc.id), { ...loc.toJSON(), children: [] });
    });

    all.forEach((loc) => {
      const node = map.get(Number(loc.id))!;
      if (loc.parent_id) {
        const parent = map.get(Number(loc.parent_id));
        if (parent) parent.children.push(node);
        else roots.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  },

  async getById(id: number): Promise<StockLocation | null> {
    return StockLocation.findByPk(id, {
      include: [
        {
          model: Warehouse,
          as: "warehouse",
          attributes: ["id", "name", "code"],
        },
        {
          model: StockLocation,
          as: "parent",
          attributes: ["id", "name", "code", "path"],
        },
        {
          model: StockLocation,
          as: "children",
          attributes: ["id", "name", "code", "type", "is_active"],
        },
      ],
    });
  },

  async getByType(
    warehouseId: number,
    type: StockLocationType,
  ): Promise<StockLocation[]> {
    return StockLocation.findAll({
      where: { warehouse_id: warehouseId, type, is_active: true },
      order: [["name", "ASC"]],
    });
  },

  async create(data: CreateLocationDTO): Promise<StockLocation> {
    // Kiểm tra code unique
    const existing = await StockLocation.findOne({
      where: { code: data.code },
    });
    if (existing)
      throw new Error(`Location code '${data.code}' already exists`);

    // Build path
    let path: string;
    if (data.parent_id) {
      const parent = await StockLocation.findByPk(data.parent_id);
      if (!parent) throw new Error("Parent location not found");
      if (Number(parent.warehouse_id) !== Number(data.warehouse_id)) {
        throw new Error("Parent location must belong to the same warehouse");
      }
      path = `${parent.path}/${data.code}`;
    } else {
      path = `/${data.code}`;
    }

    return StockLocation.create({ ...data, path });
  },

  async update(
    id: number,
    data: UpdateLocationDTO,
  ): Promise<StockLocation | null> {
    const location = await StockLocation.findByPk(id);
    if (!location) throw new Error("Location not found");

    // Nếu đổi parent → rebuild path của node này và tất cả children
    if (data.parent_id !== undefined && data.parent_id !== location.parent_id) {
      let newBasePath: string;
      if (data.parent_id) {
        const parent = await StockLocation.findByPk(data.parent_id);
        if (!parent) throw new Error("Parent location not found");
        newBasePath = `${parent.path}/${location.code}`;
      } else {
        newBasePath = `/${location.code}`;
      }

      const oldPath = location.path!;
      await location.update({ ...data, path: newBasePath });

      // Rebuild children paths
      await stockLocationService._rebuildChildrenPaths(
        id,
        oldPath,
        newBasePath,
      );
    } else {
      await location.update(data);
    }

    return stockLocationService.getById(id);
  },

  async delete(id: number): Promise<void> {
    const location = await StockLocation.findByPk(id);
    if (!location) throw new Error("Location not found");

    // Kiểm tra có children không
    const childCount = await StockLocation.count({ where: { parent_id: id } });
    if (childCount > 0)
      throw new Error("Cannot delete location with sub-locations");

    // Kiểm tra có stock balance không
    const balanceCount = await StockBalance.count({
      where: { location_id: id },
    });
    if (balanceCount > 0)
      throw new Error("Cannot delete location with existing stock balance");

    // Kiểm tra có stock move lines không
    const moveLineCount = await StockMoveLine.count({
      where: { [Op.or]: [{ location_from_id: id }, { location_to_id: id }] },
    });
    if (moveLineCount > 0)
      throw new Error("Cannot delete location referenced in stock moves");

    await location.destroy();
  },

  /** Helper: rebuild path đệ quy cho tất cả children */
  async _rebuildChildrenPaths(
    parentId: number,
    oldParentPath: string,
    newParentPath: string,
  ): Promise<void> {
    const children = await StockLocation.findAll({
      where: { parent_id: parentId },
    });
    for (const child of children) {
      const newChildPath = child.path!.replace(oldParentPath, newParentPath);
      await child.update({ path: newChildPath });
      await stockLocationService._rebuildChildrenPaths(
        Number(child.id),
        child.path!,
        newChildPath,
      );
    }
  },
};
