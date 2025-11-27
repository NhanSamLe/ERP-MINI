import { stockMoveApi } from "../../inventory/api/stockMove.api";
import {
  StockMove,
  StockMoveCreate,
  StockMoveUpdate,
} from "../store/stock/stockmove/stockMove.types";

export const stockMoveService = {
  getAll: () => stockMoveApi.getAllStockMoves(),

  getById: (id: number) => stockMoveApi.getStockMoveById(id),

  create: (data: StockMoveCreate) => stockMoveApi.createStockMove(data),

  update: (id: number, data: StockMoveUpdate) =>
    stockMoveApi.updateStockMove(id, data),

  delete: (id: number) => stockMoveApi.deleteStockMove(id),

  search: (keyword: string): Promise<StockMove[]> =>
    stockMoveApi.search(keyword).then((res) => res.data),
};
