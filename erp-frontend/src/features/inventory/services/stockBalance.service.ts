import { stockBalanceApi } from "../api/stockBalance.api";
import { StockBalance } from "../store/stock/stockbalance/stockBalance.types";

export const stockBalanceService = {
  async getAllStockBalances(): Promise<StockBalance[]> {
    return await stockBalanceApi.getAllStockBalances();
  },

  async getStockBalanceById(id: number): Promise<StockBalance> {
    return await stockBalanceApi.getStockBalanceById(id);
  },

  async createStockBalance(data: StockBalance): Promise<StockBalance> {
    return await stockBalanceApi.createStockBalance(data);
  },

  async updateStockBalance(
    id: number,
    data: Partial<StockBalance>
  ): Promise<StockBalance> {
    return await stockBalanceApi.updateStockBalance(id, data);
  },

  async deleteStockBalance(id: number): Promise<void> {
    await stockBalanceApi.deleteStockBalance(id);
  },

  searchStockBalances: async (keyword: string) => {
    const res = await stockBalanceApi.search(keyword);
    return res.data.map((item: StockBalance) => ({
      ...item,
      quantity: Number(item.quantity),
    }));
  },
};
