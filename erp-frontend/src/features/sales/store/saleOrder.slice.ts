import { createSlice, createAsyncThunk, isPending, isRejected } from "@reduxjs/toolkit";
import { SaleOrderDto, CreateSaleOrderDto, UpdateSaleOrderDto } from "../dto/saleOrder.dto";
import * as service from "../service/saleOrder.service";

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

// ── Thunks ──────────────────────────────────────────────
export const fetchSaleOrders = createAsyncThunk<SaleOrderDto[]>(
  "saleOrders/getAll",
  async () => await service.getSaleOrders()
);

export const fetchSaleOrdersByStatus = createAsyncThunk<SaleOrderDto[], string>(
  "saleOrders/getByStatus",
  async (status) => await service.getSaleOrdersByStatus(status)
);

export const fetchSaleOrderDetail = createAsyncThunk<SaleOrderDto, number>(
  "saleOrders/getOne",
  async (id) => await service.getSaleOrderById(id)
);

export const createSaleOrder = createAsyncThunk<SaleOrderDto, CreateSaleOrderDto>(
  "saleOrders/create",
  async (data) => await service.createSaleOrder(data)
);

export const updateSaleOrder = createAsyncThunk<SaleOrderDto, { id: number; data: UpdateSaleOrderDto }>(
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

// Helper: sync item cập nhật vào danh sách
function syncItem(items: SaleOrderDto[], updated: SaleOrderDto): SaleOrderDto[] {
  const idx = items.findIndex((i) => i.id === updated.id);
  if (idx === -1) return [updated, ...items];
  const next = [...items];
  next[idx] = updated;
  return next;
}

// ── Slice ────────────────────────────────────────────────
export const saleOrderSlice = createSlice({
  name: "saleOrders",
  initialState,
  reducers: {
    clearSelected(state) {
      state.selected = null;
    },
  },
  extraReducers: (builder) => {
    // fetch all list
    builder.addCase(fetchSaleOrders.fulfilled, (state, action) => {
      state.loading = false;
      state.error = null;
      state.items = action.payload;
    });

    // fetch by status
    builder.addCase(fetchSaleOrdersByStatus.fulfilled, (state, action) => {
      state.loading = false;
      state.error = null;
      state.items = action.payload;
    });

    // fetch detail → cập nhật selected và sync list
    builder.addCase(fetchSaleOrderDetail.fulfilled, (state, action) => {
      state.loading = false;
      state.error = null;
      state.selected = action.payload;
      state.items = syncItem(state.items, action.payload);
    });

    // create → prepend vào list
    builder.addCase(createSaleOrder.fulfilled, (state, action) => {
      state.loading = false;
      state.error = null;
      state.selected = action.payload;
      state.items = [action.payload, ...state.items];
    });

    // update → sync vào list
    builder.addCase(updateSaleOrder.fulfilled, (state, action) => {
      state.loading = false;
      state.error = null;
      state.selected = action.payload;
      state.items = syncItem(state.items, action.payload);
    });

    // submit → sync vào list (status thay đổi)
    builder.addCase(submitSaleOrder.fulfilled, (state, action) => {
      state.loading = false;
      state.error = null;
      state.selected = action.payload;
      state.items = syncItem(state.items, action.payload);
    });

    // approve → sync vào list
    builder.addCase(approveSaleOrder.fulfilled, (state, action) => {
      state.loading = false;
      state.error = null;
      state.selected = action.payload;
      state.items = syncItem(state.items, action.payload);
    });

    // reject → sync vào list
    builder.addCase(rejectSaleOrder.fulfilled, (state, action) => {
      state.loading = false;
      state.error = null;
      state.selected = action.payload;
      state.items = syncItem(state.items, action.payload);
    });

    // loading
    builder.addMatcher(
      isPending(fetchSaleOrders, fetchSaleOrdersByStatus, fetchSaleOrderDetail, createSaleOrder, updateSaleOrder, submitSaleOrder, approveSaleOrder, rejectSaleOrder),
      (state) => {
        state.loading = true;
        state.error = null;
      }
    );

    // error
    builder.addMatcher(
      isRejected(fetchSaleOrders, fetchSaleOrdersByStatus, fetchSaleOrderDetail, createSaleOrder, updateSaleOrder, submitSaleOrder, approveSaleOrder, rejectSaleOrder),
      (state, action) => {
        state.loading = false;
        state.error = action.error?.message ?? "Lỗi xảy ra";
      }
    );
  },
});

export const { clearSelected } = saleOrderSlice.actions;
export default saleOrderSlice.reducer;
