import { createSlice, createAsyncThunk, isPending, isRejected } from "@reduxjs/toolkit";
import {
  ArReceiptDto,
  CreateReceiptDto,
  UpdateReceiptDto,
  AllocateReceiptDto,
  UnpaidInvoiceDto,
  ReceiptFilterDto,
  CustomerWithDebtDto,
} from "../dto/receipt.dto";
import * as service from "../service/receipt.service";

interface ReceiptState {
  items: ArReceiptDto[];
  unpaidInvoices: UnpaidInvoiceDto[];
  customersWithDebt: CustomerWithDebtDto[];
  selected: ArReceiptDto | null;
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

const initialState: ReceiptState = {
  items: [],
  unpaidInvoices: [],
  customersWithDebt: [],
  selected: null,
  loading: false,
  error: null,
  total: 0,
  page: 1,
  page_size: 20,
  total_pages: 1,
};

// ── Thunks ──────────────────────────────────────────────
export const fetchReceiptDetail = createAsyncThunk<ArReceiptDto, number>(
  "receipts/getOne",
  async (id) => await service.getReceiptById(id)
);

export const createReceipt = createAsyncThunk<ArReceiptDto, CreateReceiptDto>(
  "receipts/create",
  async (data) => await service.createReceipt(data)
);

export const updateReceipt = createAsyncThunk<ArReceiptDto, { id: number; data: UpdateReceiptDto }>(
  "receipts/update",
  async ({ id, data }) => await service.updateReceipt(id, data)
);

export const submitReceipt = createAsyncThunk<ArReceiptDto, number>(
  "receipts/submit",
  async (id) => await service.submitReceipt(id)
);

export const approveReceipt = createAsyncThunk<ArReceiptDto, number>(
  "receipts/approve",
  async (id) => await service.approveReceipt(id)
);

export const rejectReceipt = createAsyncThunk<ArReceiptDto, { id: number; reason: string }>(
  "receipts/reject",
  async ({ id, reason }) => await service.rejectReceipt(id, reason)
);

export const allocateReceipt = createAsyncThunk<ArReceiptDto, { id: number; allocations: AllocateReceiptDto[] }>(
  "receipts/allocate",
  async ({ id, allocations }) => await service.allocateReceipt(id, allocations)
);

export const fetchUnpaidInvoices = createAsyncThunk<UnpaidInvoiceDto[], number>(
  "receipts/unpaidInvoices",
  async (customerId) => await service.getCustomerUnpaidInvoicesService(customerId)
);

export const fetchFilteredReceipts = createAsyncThunk(
  "receipts/filter",
  async (filters: ReceiptFilterDto) => await service.searchReceipts(filters)
);

export const fetchCustomersWithDebt = createAsyncThunk<CustomerWithDebtDto[]>(
  "receipts/customersDebt",
  async () => await service.getCustomersWithDebtService()
);

// Helper: sync item cập nhật vào danh sách
function syncItem(items: ArReceiptDto[], updated: ArReceiptDto): ArReceiptDto[] {
  const idx = items.findIndex((i) => i.id === updated.id);
  if (idx === -1) return [updated, ...items];
  const next = [...items];
  next[idx] = updated;
  return next;
}

// ── Slice ────────────────────────────────────────────────
export const receiptSlice = createSlice({
  name: "receipts",
  initialState,
  reducers: {
    clearSelected(state) {
      state.selected = null;
    },
  },
  extraReducers: (builder) => {
    // fetch detail
    builder.addCase(fetchReceiptDetail.fulfilled, (state, action) => {
      state.loading = false;
      state.error = null;
      state.selected = action.payload;
      state.items = syncItem(state.items, action.payload);
    });

    // create → prepend vào list
    builder.addCase(createReceipt.fulfilled, (state, action) => {
      state.loading = false;
      state.error = null;
      state.selected = action.payload;
      state.items = [action.payload, ...state.items];
      state.total += 1;
    });

    // update → sync vào list
    builder.addCase(updateReceipt.fulfilled, (state, action) => {
      state.loading = false;
      state.error = null;
      state.selected = action.payload;
      state.items = syncItem(state.items, action.payload);
    });

    // submit → sync vào list
    builder.addCase(submitReceipt.fulfilled, (state, action) => {
      state.loading = false;
      state.error = null;
      state.selected = action.payload;
      state.items = syncItem(state.items, action.payload);
    });

    // approve → sync vào list
    builder.addCase(approveReceipt.fulfilled, (state, action) => {
      state.loading = false;
      state.error = null;
      state.selected = action.payload;
      state.items = syncItem(state.items, action.payload);
    });

    // reject → sync vào list
    builder.addCase(rejectReceipt.fulfilled, (state, action) => {
      state.loading = false;
      state.error = null;
      state.selected = action.payload;
      state.items = syncItem(state.items, action.payload);
    });

    // allocate → sync vào list (allocation thay đổi status)
    builder.addCase(allocateReceipt.fulfilled, (state, action) => {
      state.loading = false;
      state.error = null;
      state.selected = action.payload;
      state.items = syncItem(state.items, action.payload);
    });

    // filtered list (phân trang)
    builder.addCase(fetchFilteredReceipts.fulfilled, (state, action) => {
      state.loading = false;
      state.error = null;
      state.items = action.payload.items;
      state.total = action.payload.total;
      state.page = action.payload.page;
      state.page_size = action.payload.page_size;
      state.total_pages = action.payload.total_pages;
    });

    builder.addCase(fetchUnpaidInvoices.fulfilled, (state, action) => {
      state.unpaidInvoices = action.payload;
    });

    builder.addCase(fetchCustomersWithDebt.fulfilled, (state, action) => {
      state.customersWithDebt = action.payload;
    });

    // loading
    builder.addMatcher(
      isPending(fetchReceiptDetail, createReceipt, updateReceipt, submitReceipt, approveReceipt, rejectReceipt, allocateReceipt),
      (state) => {
        state.loading = true;
        state.error = null;
      }
    );

    // error
    builder.addMatcher(
      isRejected(fetchReceiptDetail, createReceipt, updateReceipt, submitReceipt, approveReceipt, rejectReceipt, allocateReceipt),
      (state, action) => {
        state.loading = false;
        state.error = action.error?.message ?? "Lỗi xảy ra";
      }
    );
  },
});

export const { clearSelected } = receiptSlice.actions;
export default receiptSlice.reducer;
