import type {
  Position as PositionBase,
  PositionFilter as PositionFilterBase,
} from "../store/position/position.type";

// DTO: id là optional để create không cần id
export type PositionDTO = Omit<PositionBase, "id"> & { id?: number };

export type PositionFilter = PositionFilterBase;
