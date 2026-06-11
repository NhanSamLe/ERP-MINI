// src/store/slices/saleOrder.slice.ts
import {
  createSlice,
  createAsyncThunk,
  PayloadAction,
  isPending,
  isFulfilled,
  isRejected,
} from "@reduxjs/toolkit";
import {
  SaleOrderDto,
  CreateSaleOrderDto,
  UpdateSaleOrderDto,
} from "../dto/saleOrder.dto";
import * as service from "../service/saleOrder.service";

// ==============================
// TYPES
// ==============================
export interface SaleOrderState {
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

export const createSaleOrder = createAsyncThunk<
  SaleOrderDto,
  CreateSaleOrderDto
>("saleOrders/create", async (data) => await service.createSaleOrder(data));

export const updateSaleOrder = createAsyncThunk<
  SaleOrderDto,
  { id: number; data: UpdateSaleOrderDto }
>(
  "saleOrders/update",
  async ({ id, data }) => await service.updateSaleOrder(id, data)
);

export const submitSaleOrder = createAsyncThunk<SaleOrderDto, number, { rejectValue: string }>(
  "saleOrders/submit",
  async (id, { rejectWithValue }) => {
    try {
      return await service.submitSaleOrder(id);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const approveSaleOrder = createAsyncThunk<SaleOrderDto, number, { rejectValue: string }>(
  "saleOrders/approve",
  async (id, { rejectWithValue }) => {
    try {
      return await service.approveSaleOrder(id);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const rejectSaleOrder = createAsyncThunk<
  SaleOrderDto,
  { id: number; reason: string },
  { rejectValue: string }
>(
  "saleOrders/reject",
  async ({ id, reason }, { rejectWithValue }) => {
    try {
      return await service.rejectSaleOrder(id, reason);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchSaleOrdersByStatus = createAsyncThunk<SaleOrderDto[], string>(
  "saleOrders/getByStatus",
  async (status) => {
    const res = await service.getSaleOrdersByStatus(status);
    return res;
  }
);

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
        fetchSaleOrdersByStatus,
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
        fetchSaleOrdersByStatus,
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
        fetchSaleOrdersByStatus,
        fetchSaleOrderDetail,
        createSaleOrder,
        updateSaleOrder,
        submitSaleOrder,
        approveSaleOrder,
        rejectSaleOrder
      ),
      (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error?.message || "Error occurred";
      }
    );
  },
});

export const { clearSelected } = saleOrderSlice.actions;
export default saleOrderSlice.reducer;
