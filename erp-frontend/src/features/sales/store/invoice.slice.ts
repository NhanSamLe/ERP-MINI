import { createSlice, createAsyncThunk, isPending, isRejected } from "@reduxjs/toolkit";
import { ArInvoiceDto, CreateInvoiceDto } from "../dto/invoice.dto";
import * as service from "../service/invoice.service";
import { SaleOrderDto } from "../dto/saleOrder.dto";

interface InvoiceState {
  items: ArInvoiceDto[];
  availableOrders: SaleOrderDto[];
  selected: ArInvoiceDto | null;
  loading: boolean;
  error: string | null;
}

const initialState: InvoiceState = {
  items: [],
  availableOrders: [],
  selected: null,
  loading: false,
  error: null,
};

// ── Thunks ──────────────────────────────────────────────
export const fetchInvoices = createAsyncThunk<ArInvoiceDto[]>(
  "invoices/getAll",
  async () => await service.getInvoices()
);

export const fetchInvoiceDetail = createAsyncThunk<ArInvoiceDto, number>(
  "invoices/getOne",
  async (id) => await service.getInvoiceById(id)
);

export const createInvoice = createAsyncThunk<ArInvoiceDto, CreateInvoiceDto, { rejectValue: string }>(
  "invoices/create",
  async (data, { rejectWithValue }) => {
    try {
      return await service.createInvoice(data);
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message ?? err?.message ?? "Tạo hóa đơn thất bại");
    }
  }
);

export const fetchAvailableOrders = createAsyncThunk<SaleOrderDto[]>(
  "invoices/availableOrders",
  async () => await service.getAvailableOrders()
);

export const submitInvoice = createAsyncThunk<ArInvoiceDto, number>(
  "invoices/submit",
  async (id) => await service.submitInvoice(id)
);

export const approveInvoice = createAsyncThunk<ArInvoiceDto, number>(
  "invoices/approve",
  async (id) => await service.approveInvoice(id)
);

export const rejectInvoice = createAsyncThunk<ArInvoiceDto, { id: number; reason: string }>(
  "invoices/reject",
  async ({ id, reason }) => await service.rejectInvoice(id, reason)
);

// Helper: cập nhật item trong danh sách
function syncItem(items: ArInvoiceDto[], updated: ArInvoiceDto): ArInvoiceDto[] {
  const idx = items.findIndex((i) => i.id === updated.id);
  if (idx === -1) return [updated, ...items];
  const next = [...items];
  next[idx] = updated;
  return next;
}

// ── Slice ────────────────────────────────────────────────
export const invoiceSlice = createSlice({
  name: "invoices",
  initialState,
  reducers: {
    clearSelected(state) {
      state.selected = null;
    },
  },
  extraReducers: (builder) => {
    // fetch list
    builder.addCase(fetchInvoices.fulfilled, (state, action) => {
      state.loading = false;
      state.error = null;
      state.items = action.payload;
    });

    // fetch available orders
    builder.addCase(fetchAvailableOrders.fulfilled, (state, action) => {
      state.loading = false;
      state.error = null;
      state.availableOrders = action.payload;
    });

    // fetch detail
    builder.addCase(fetchInvoiceDetail.fulfilled, (state, action) => {
      state.loading = false;
      state.error = null;
      state.selected = action.payload;
      state.items = syncItem(state.items, action.payload);
    });

    // create → prepend vào list
    builder.addCase(createInvoice.fulfilled, (state, action) => {
      state.loading = false;
      state.error = null;
      state.selected = action.payload;
      state.items = [action.payload, ...state.items];
    });

    // submit / approve / reject → update item trong list
    builder.addCase(submitInvoice.fulfilled, (state, action) => {
      state.loading = false;
      state.error = null;
      state.selected = action.payload;
      state.items = syncItem(state.items, action.payload);
    });

    builder.addCase(approveInvoice.fulfilled, (state, action) => {
      state.loading = false;
      state.error = null;
      state.selected = action.payload;
      state.items = syncItem(state.items, action.payload);
    });

    builder.addCase(rejectInvoice.fulfilled, (state, action) => {
      state.loading = false;
      state.error = null;
      state.selected = action.payload;
      state.items = syncItem(state.items, action.payload);
    });

    // loading
    builder.addMatcher(
      isPending(fetchInvoices, fetchInvoiceDetail, createInvoice, submitInvoice, approveInvoice, rejectInvoice, fetchAvailableOrders),
      (state) => {
        state.loading = true;
        state.error = null;
      }
    );

    // error
    builder.addMatcher(
      isRejected(fetchInvoices, fetchInvoiceDetail, createInvoice, submitInvoice, approveInvoice, rejectInvoice, fetchAvailableOrders),
      (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) ?? action.error?.message ?? "Lỗi xảy ra";
      }
    );
  },
});

export const { clearSelected } = invoiceSlice.actions;
export default invoiceSlice.reducer;
