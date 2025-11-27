import axiosClient from "../../../api/axiosClient";
import {
  StockMove,
  StockMoveCreate,
  StockMoveUpdate,
} from "../store/stock/stockmove/stockMove.types";

export const stockMoveApi = {
  getAllStockMoves: async (): Promise<StockMove[]> => {
    const res = await axiosClient.get("/stock-move");
    return res.data;
  },

  getStockMoveById: async (id: number): Promise<StockMove> => {
    const res = await axiosClient.get(`/stock-move/${id}`);
    return res.data;
  },

  createStockMove: async (data: StockMoveCreate): Promise<StockMove> => {
    const res = await axiosClient.post("/stock-move", data);
    return res.data;
  },

  updateStockMove: async (
    id: number,
    data: StockMoveUpdate
  ): Promise<StockMove> => {
    const res = await axiosClient.put(`/stock-move/${id}`, data);
    return res.data;
  },

  deleteStockMove: async (id: number): Promise<void> => {
    await axiosClient.delete(`/stock-move/${id}`);
  },

  search: (keyword: string) => {
    return axiosClient.get(`/stock-move/search?q=${keyword}`);
  },
};
