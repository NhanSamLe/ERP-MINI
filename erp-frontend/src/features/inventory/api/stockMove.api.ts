import axiosClient from "../../../api/axiosClient";
import {
  StockMove,
  StockMoveCreate,
  StockMoveTransferCreate,
  StockMoveTransferUpdate,
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

  createReceiptStockMove: async (data: StockMoveCreate): Promise<StockMove> => {
    const res = await axiosClient.post("/stock-move/receipt", data);
    return res.data;
  },

  createTransferStockMove: async (
    data: StockMoveTransferCreate
  ): Promise<StockMove> => {
    const res = await axiosClient.post("/stock-move/transfer", data);
    return res.data;
  },

  updateReceiptStockMove: async (
    id: number,
    data: StockMoveUpdate
  ): Promise<StockMove> => {
    const res = await axiosClient.put(`/stock-move/receipt/${id}`, data);
    return res.data;
  },

  updateTransferStockMove: async (
    id: number,
    data: StockMoveTransferUpdate
  ): Promise<StockMove> => {
    const res = await axiosClient.put(`/stock-move/transfer/${id}`, data);
    return res.data;
  },

  deleteStockMove: async (id: number): Promise<void> => {
    await axiosClient.delete(`/stock-move/${id}`);
  },

  search: (keyword: string) => {
    return axiosClient.get(`/stock-move/search?q=${keyword}`);
  },
};
