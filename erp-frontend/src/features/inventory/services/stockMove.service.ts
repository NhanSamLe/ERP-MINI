import { stockMoveApi } from "../../inventory/api/stockMove.api";
import {
  StockMove,
  StockMoveAdjustmentCreate,
  StockMoveAdjustmentUpdate,
  StockMoveCreate,
  StockMoveTransferCreate,
  StockMoveTransferUpdate,
  StockMoveUpdate,
} from "../store/stock/stockmove/stockMove.types";

export const stockMoveService = {
  getAll: () => stockMoveApi.getAllStockMoves(),

  getById: (id: number) => stockMoveApi.getStockMoveById(id),

  createReceiptStockMove: (data: StockMoveCreate) =>
    stockMoveApi.createReceiptStockMove(data),

  createIsssueStockMove: (data: StockMoveCreate) =>
    stockMoveApi.createIssueStockMove(data),

  createTransferStockMove: (data: StockMoveTransferCreate) =>
    stockMoveApi.createTransferStockMove(data),

  createAdjustmentStockMove: (data: StockMoveAdjustmentCreate) =>
    stockMoveApi.createAdjustmentStockMove(data),

  updateReceiptStockMove: (id: number, data: StockMoveUpdate) =>
    stockMoveApi.updateReceiptStockMove(id, data),

  updateIssueStockMove: (id: number, data: StockMoveUpdate) =>
    stockMoveApi.updateIssueStockMove(id, data),

  updateTransferStockMove: (id: number, data: StockMoveTransferUpdate) =>
    stockMoveApi.updateTransferStockMove(id, data),

  updateAdjustmentStockMove: (id: number, data: StockMoveAdjustmentUpdate) =>
    stockMoveApi.updateAdjustmentStockMove(id, data),

  delete: (id: number) => stockMoveApi.deleteStockMove(id),

  search: (keyword: string): Promise<StockMove[]> =>
    stockMoveApi.search(keyword).then((res) => res.data),

  submitForApproval(id: number): Promise<StockMove> {
    return stockMoveApi.submitForApproval(id);
  },

  approveStockMove: async (id: number): Promise<StockMove> => {
    const res = await stockMoveApi.approve(id);
    return res.data;
  },

  rejectStockMove: async (id: number, rejectReason: string) => {
    const res = await stockMoveApi.rejectStockMove(id, rejectReason);
    return res.data;
  },
};
