import axiosClient from "../../../api/axiosClient";
import { StockBalance } from "../store/stock/stockbalance/stockBalance.types";

export const stockBalanceApi = {
  getAllStockBalances: async (): Promise<StockBalance[]> => {
    const res = await axiosClient.get("/stock-balance");
    return res.data;
  },

  getStockBalanceById: async (id: number): Promise<StockBalance> => {
    const res = await axiosClient.get(`/stock-balance/${id}`);
    return res.data;
  },

  createStockBalance: async (data: StockBalance): Promise<StockBalance> => {
    const res = await axiosClient.post("/stock-balance", data);
    return res.data;
  },

  updateStockBalance: async (
    id: number,
    data: Partial<StockBalance>
  ): Promise<StockBalance> => {
    const res = await axiosClient.put(`/stock-balance/${id}`, data);
    return res.data;
  },

  // Xóa stock balance
  deleteStockBalance: async (id: number): Promise<void> => {
    await axiosClient.delete(`/stock-balance/${id}`);
  },

  // Tìm kiếm tồn kho theo product hoặc warehouse
  search: (keyword: string) => {
    return axiosClient.get(`/stock-balance/search?q=${keyword}`);
  },
};
