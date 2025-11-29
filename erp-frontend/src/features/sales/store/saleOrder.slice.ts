// src/store/slices/saleOrder.slice.ts
import { createSlice, createAsyncThunk, PayloadAction, isPending, isFulfilled, isRejected } from "@reduxjs/toolkit";
import {
  SaleOrderDto,
  CreateSaleOrderDto,
  UpdateSaleOrderDto,
} from "../dto/saleOrder.dto";
import * as service from "../service/saleOrder.service";

// ==============================
// TYPES
// ==============================
interface SaleOrderState {
  items: SaleOrderDto[];
  selected: SaleOrderDto | null;
  loading: boolean;
  error: string | null;
}

const initialState: SaleOrderState = {
  items: [],
  selected: null,
  loading: false,
  error: null,
};

// ==============================
// ASYNC ACTIONS
// ==============================
export const fetchSaleOrders = createAsyncThunk<SaleOrderDto[]>(
  "saleOrders/getAll",
  async () => await service.getSaleOrders()
);

export const fetchSaleOrderDetail = createAsyncThunk<SaleOrderDto, number>(
  "saleOrders/getOne",
  async (id) => await service.getSaleOrderById(id)
);

export const createSaleOrder = createAsyncThunk<SaleOrderDto, CreateSaleOrderDto>(
  "saleOrders/create",
  async (data) => await service.createSaleOrder(data)
);

export const updateSaleOrder = createAsyncThunk<
  SaleOrderDto,
  { id: number; data: UpdateSaleOrderDto }
>("saleOrders/update", async ({ id, data }) => await service.updateSaleOrder(id, data));

export const submitSaleOrder = createAsyncThunk<SaleOrderDto, number>(
  "saleOrders/submit",
  async (id) => await service.submitSaleOrder(id)
);

export const approveSaleOrder = createAsyncThunk<SaleOrderDto, number>(
  "saleOrders/approve",
  async (id) => await service.approveSaleOrder(id)
);

export const rejectSaleOrder = createAsyncThunk<
  SaleOrderDto,
  { id: number; reason: string }
>("saleOrders/reject", async ({ id, reason }) => await service.rejectSaleOrder(id, reason));

// ==============================
// SLICE
// ==============================
export const saleOrderSlice = createSlice({
  name: "saleOrders",
  initialState,
  reducers: {
    clearSelected(state) {
      state.selected = null;
    },
  },
  extraReducers: (builder) => {
    // Fulfilled actions
    builder.addMatcher(
      isFulfilled(
        fetchSaleOrders,
        fetchSaleOrderDetail,
        createSaleOrder,
        updateSaleOrder,
        submitSaleOrder,
        approveSaleOrder,
        rejectSaleOrder
      ),
      (state, action: PayloadAction<SaleOrderDto | SaleOrderDto[]>) => {
        state.loading = false;
        state.error = null;

        if (Array.isArray(action.payload)) {
          state.items = action.payload;
        } else {
          state.selected = action.payload;
        }
      }
    );

    // Pending actions
    builder.addMatcher(
      isPending(
        fetchSaleOrders,
        fetchSaleOrderDetail,
        createSaleOrder,
        updateSaleOrder,
        submitSaleOrder,
        approveSaleOrder,
        rejectSaleOrder
      ),
      (state) => {
        state.loading = true;
        state.error = null;
      }
    );

    // Rejected actions
    builder.addMatcher(
      isRejected(
        fetchSaleOrders,
        fetchSaleOrderDetail,
        createSaleOrder,
        updateSaleOrder,
        submitSaleOrder,
        approveSaleOrder,
        rejectSaleOrder
      ),
      (state, action) => {
        state.loading = false;
        state.error = action.error?.message ?? "Error occurred";
      }
    );
  },
});

export const { clearSelected } = saleOrderSlice.actions;
export default saleOrderSlice.reducer;
