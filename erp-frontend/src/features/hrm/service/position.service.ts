import { positionApi } from "../api/position.api";
import type { PositionDTO, PositionFilter } from "../dto/position.dto";

export async function fetchPositions(filter?: PositionFilter) {
  return positionApi.getAll(filter);
}

export async function createPosition(data: PositionDTO) {
  return positionApi.create(data);
}

export async function updatePosition(id: number, data: Partial<PositionDTO>) {
  return positionApi.update(id, data);
}

export async function deletePosition(id: number) {
  return positionApi.remove(id);
}
