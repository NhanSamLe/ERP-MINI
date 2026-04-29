import { Op } from "sequelize";
import { Position, PositionAttrs } from "../models/position.model";

export interface PositionFilter {
  search?: string;
  branch_id?: number;
}

// Tạo type cho create / update
export type PositionCreateInput = Omit<PositionAttrs, "id">;
export type PositionUpdateInput = Partial<Omit<PositionAttrs, "id">>;

export async function getAllPositions(
  filter: PositionFilter = {}
): Promise<Position[]> {
  const where: any = {};

  if (filter.branch_id) {
    where.branch_id = filter.branch_id;
  }

  if (filter.search) {
    // tuỳ bạn muốn search theo name, sau này có code thì thêm
    where.name = { [Op.like]: `%${filter.search}%` };
  }

  return Position.findAll({
    where,
    order: [["id", "ASC"]],
  });
}

export async function getPositionById(id: number): Promise<Position> {
  const row = await Position.findByPk(id);
  if (!row) {
    throw new Error("Position not found");
  }
  return row;
}

export async function createPosition(
  payload: PositionCreateInput
): Promise<Position> {
  if (!payload.branch_id) throw new Error("branch_id is required");
  if (!payload.name) throw new Error("name is required");

  const exists = await Position.findOne({
    where: { branch_id: payload.branch_id, name: payload.name },
  });
  if (exists) throw new Error("Chức danh này đã tồn tại trong chi nhánh này");

  const row = await Position.create({ ...payload, status: "active" });
  return row;
}


export async function updatePosition(
  id: number,
  payload: PositionUpdateInput
): Promise<Position> {
  const row = await Position.findByPk(id);
  if (!row) throw new Error("Position not found");

  // Nếu user đổi tên hoặc đổi branch → check trùng
  if (payload.branch_id || payload.name) {
    const exists = await Position.findOne({
      where: {
        branch_id: payload.branch_id ?? row.branch_id,
        name: payload.name ?? row.name,
        id: { [Op.ne]: id }, // bỏ qua chính nó
      },
    });

    if (exists) {
      throw new Error("Chức danh này đã tồn tại trong chi nhánh này");
    }
  }

  await row.update(payload);
  return row;
}


export async function togglePositionStatus(
  id: number,
  status: "active" | "inactive"
): Promise<Position> {
  const row = await Position.findByPk(id);

  if (!row) {
    throw new Error("Position not found");
  }

  await row.update({ status });

  return row;
}