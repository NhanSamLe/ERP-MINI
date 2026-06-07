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

export const submitSaleOrder = createAsyncThunk<SaleOrderDto, number>(
  "saleOrders/submit",
  async (id) => await service.submitSaleOrder(id)
);

export const approveSaleOrder = createAsyncThunk<SaleOrderDto, number>(
  "saleOrders/approve",
  async (id) => await service.approveSaleOrder(id)
);

export const rejectSaleOrder = createAsyncThunk<SaleOrderDto, { id: number; reason: string }>(
  "saleOrders/reject",
  async ({ id, reason }) => await service.rejectSaleOrder(id, reason)
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
