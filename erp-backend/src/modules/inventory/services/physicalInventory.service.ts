import { Op } from "sequelize";
import { PhysicalInventory } from "../models/physicalInventory.model";
import { PhysicalInventoryLine } from "../models/physicalInventoryLine.model";
import { StockBalance } from "../models/stockBalance.model";
import { Product } from "../../product/models/product.model";
import { StockLocation } from "../models/stockLocation.model";
import { StockLot } from "../models/stockLot.model";
import { Warehouse } from "../models/warehouse.model";
import { User } from "../../auth/models/user.model";
import { Uom } from "../../master-data/models/uom.model";
import {
  CreateInventoryDTO,
  CreateInventoryLineDTO,
  UpdateInventoryLineDTO,
} from "../dto/physicalInventory.dto";

export type {
  CreateInventoryDTO,
  CreateInventoryLineDTO,
  UpdateInventoryLineDTO,
};

const LINE_INCLUDE = [
  {
    model: Product,
    as: "product",
    attributes: ["id", "name", "sku", "image_url"],
    include: [{ model: Uom, as: "uom", attributes: ["id", "code", "name"] }],
  },
  {
    model: StockLocation,
    as: "location",
    attributes: ["id", "name", "code", "type"],
  },
  {
    model: StockLot,
    as: "lot",
    attributes: ["id", "lot_no", "expiry_date"],
  },
];

const HEADER_INCLUDE = [
  { model: Warehouse, as: "warehouse", attributes: ["id", "name", "code"] },
  {
    model: User,
    as: "creator",
    attributes: ["id", "full_name", "email", "avatar_url"],
  },
  {
    model: User,
    as: "validator",
    attributes: ["id", "full_name", "email", "avatar_url"],
  },
];

function generateInvNo(): string {
  const ts = Date.now();
  const rand = Math.floor(100 + Math.random() * 900);
  return `PI${ts}${rand}`;
}

export const physicalInventoryService = {
  async getAll(branchId: number) {
    return PhysicalInventory.findAll({
      where: { branch_id: branchId },
      include: HEADER_INCLUDE,
      order: [["id", "DESC"]],
    });
  },

  async getById(id: number) {
    return PhysicalInventory.findByPk(id, {
      include: [
        ...HEADER_INCLUDE,
        { model: PhysicalInventoryLine, as: "lines", include: LINE_INCLUDE },
      ],
    });
  },

  async create(data: CreateInventoryDTO, userId: number) {
    return PhysicalInventory.create({
      inv_no: generateInvNo(),
      warehouse_id: data.warehouse_id,
      branch_id: data.branch_id,
      inv_date: data.inv_date,
      status: "draft",
      created_by: userId,
    });
  },

  /** draft → in_progress: load theoretical_qty từ stock_balances */
  async startInventory(id: number) {
    const inv = await PhysicalInventory.findByPk(id, {
      include: [{ model: PhysicalInventoryLine, as: "lines" }],
    });
    if (!inv) throw { status: 404, message: "Physical inventory not found" };
    if (inv.status !== "draft")
      throw { status: 400, message: "Only draft inventories can be started" };

    // Load tất cả stock_balances của warehouse này
    const balances = await StockBalance.findAll({
      where: { warehouse_id: inv.warehouse_id },
    });

    // Nếu chưa có lines → tự tạo từ balances
    const existingLines = (inv as any).lines as PhysicalInventoryLine[];
    if (!existingLines || existingLines.length === 0) {
      await Promise.all(
        balances.map((b) =>
          PhysicalInventoryLine.create({
            inventory_id: id,
            product_id: b.product_id,
            location_id: b.location_id ?? null,
            lot_id: b.lot_id ?? null,
            theoretical_qty: Number(b.quantity),
            counted_qty: 0,
            difference_qty: -Number(b.quantity),
            unit_cost: b.unit_cost ?? null,
          }),
        ),
      );
    } else {
      // Cập nhật theoretical_qty cho các lines đã có
      await Promise.all(
        existingLines.map(async (line) => {
          const balance = balances.find(
            (b) =>
              b.product_id === line.product_id &&
              (b.location_id ?? null) === (line.location_id ?? null) &&
              (b.lot_id ?? null) === (line.lot_id ?? null),
          );
          const theoretical = balance ? Number(balance.quantity) : 0;
          await line.update({
            theoretical_qty: theoretical,
            difference_qty: Number(line.counted_qty) - theoretical,
            unit_cost: balance?.unit_cost ?? null,
          });
        }),
      );
    }

    await inv.update({ status: "in_progress" });
    return this.getById(id);
  },

  /** Thêm line thủ công khi in_progress */
  async addLine(id: number, data: CreateInventoryLineDTO) {
    const inv = await PhysicalInventory.findByPk(id);
    if (!inv) throw { status: 404, message: "Physical inventory not found" };
    if (inv.status !== "in_progress")
      throw { status: 400, message: "Can only add lines when in_progress" };

    // Lấy theoretical_qty từ stock_balance
    const balanceWhere: any = {
      warehouse_id: inv.warehouse_id,
      product_id: data.product_id,
    };
    if (data.location_id) balanceWhere.location_id = data.location_id;
    if (data.lot_id) balanceWhere.lot_id = data.lot_id;

    const balance = await StockBalance.findOne({ where: balanceWhere });
    const theoretical = balance ? Number(balance.quantity) : 0;

    const line = await PhysicalInventoryLine.create({
      inventory_id: id,
      product_id: data.product_id,
      location_id: data.location_id ?? null,
      lot_id: data.lot_id ?? null,
      theoretical_qty: theoretical,
      counted_qty: 0,
      difference_qty: -theoretical,
      unit_cost: balance?.unit_cost ?? null,
    });

    return PhysicalInventoryLine.findByPk(line.id, { include: LINE_INCLUDE });
  },

  /** Cập nhật counted_qty cho một line */
  async updateLine(lineId: number, data: UpdateInventoryLineDTO) {
    const line = await PhysicalInventoryLine.findByPk(lineId, {
      include: [
        {
          model: PhysicalInventory,
          as: "inventory",
          attributes: ["id", "status"],
        },
      ],
    });
    if (!line) throw { status: 404, message: "Line not found" };

    const inv = (line as any).inventory as PhysicalInventory;
    if (inv.status !== "in_progress")
      throw { status: 400, message: "Can only update lines when in_progress" };

    const counted = Number(data.counted_qty);
    const diff = counted - Number(line.theoretical_qty);
    await line.update({ counted_qty: counted, difference_qty: diff });

    return PhysicalInventoryLine.findByPk(lineId, { include: LINE_INCLUDE });
  },

  /** in_progress → validated: tạo stock adjustment cho các dòng chênh lệch */
  async validate(id: number, userId: number) {
    const inv = await PhysicalInventory.findByPk(id, {
      include: [{ model: PhysicalInventoryLine, as: "lines" }],
    });
    if (!inv) throw { status: 404, message: "Physical inventory not found" };
    if (inv.status !== "in_progress")
      throw {
        status: 400,
        message: "Only in_progress inventories can be validated",
      };

    const lines = (inv as any).lines as PhysicalInventoryLine[];

    // Cập nhật stock_balances cho các dòng có chênh lệch
    await Promise.all(
      lines
        .filter((l) => Number(l.difference_qty) !== 0)
        .map(async (line) => {
          const where: any = {
            warehouse_id: inv.warehouse_id,
            product_id: line.product_id,
          };
          if (line.location_id) where.location_id = line.location_id;
          if (line.lot_id) where.lot_id = line.lot_id;

          const balance = await StockBalance.findOne({ where });
          const diff = Number(line.difference_qty);

          if (balance) {
            const newQty = Number(balance.quantity) + diff;
            const newValue = newQty * Number(balance.unit_cost ?? 0);
            await balance.update({
              quantity: newQty,
              total_value: newValue,
            });
          } else if (diff > 0) {
            // Tạo mới balance nếu chưa có và diff dương
            await StockBalance.create({
              warehouse_id: inv.warehouse_id,
              product_id: line.product_id,
              location_id: line.location_id ?? null,
              lot_id: line.lot_id ?? null,
              quantity: diff,
              unit_cost: line.unit_cost ?? 0,
              total_value: diff * Number(line.unit_cost ?? 0),
            });
          }
        }),
    );

    await inv.update({
      status: "validated",
      validated_by: userId,
      validated_at: new Date(),
    });

    return this.getById(id);
  },

  /** draft | in_progress → cancelled */
  async cancel(id: number) {
    const inv = await PhysicalInventory.findByPk(id);
    if (!inv) throw { status: 404, message: "Physical inventory not found" };
    if (!["draft", "in_progress"].includes(inv.status))
      throw {
        status: 400,
        message: "Only draft or in_progress inventories can be cancelled",
      };

    await inv.update({ status: "cancelled" });
    return this.getById(id);
  },
};
