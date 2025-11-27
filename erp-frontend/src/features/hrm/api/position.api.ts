import axiosClient from "../../../api/axiosClient";
import type { PositionFilter, PositionDTO } from "../dto/position.dto";
import type { Position } from "../store/position/position.type";

export const positionApi = {
  // GET /hrm/positions
  async getAll(filter?: PositionFilter) {
    const res = await axiosClient.get<Position[]>("/hrm/positions", {
      params: filter,
    });
    return res.data; // trả về Position[]
  },

  // POST /hrm/positions
  async create(data: PositionDTO) {
    const res = await axiosClient.post<Position>("/hrm/positions", data);
    return res.data; // trả về Position
  },

  // PUT /hrm/positions/:id
  async update(id: number, data: Partial<PositionDTO>) {
    const res = await axiosClient.put<Position>(`/hrm/positions/${id}`, data);
    return res.data; // trả về Position
  },

  // DELETE /hrm/positions/:id
  async remove(id: number) {
    await axiosClient.delete(`/hrm/positions/${id}`);
  },
};
