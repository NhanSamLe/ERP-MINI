// src/store/slices/invoice.slice.ts
import { createSlice, createAsyncThunk, PayloadAction, isPending, isFulfilled, isRejected } from "@reduxjs/toolkit";
import {
  ArInvoiceDto,
  CreateInvoiceDto,
  UpdateInvoiceDto,
} from "../dto/invoice.dto";
import * as service from "../service/invoice.service";

interface InvoiceState {
  items: ArInvoiceDto[];
  selected: ArInvoiceDto | null;
  loading: boolean;
  error: string | null;
}

const initialState: InvoiceState = {
  items: [],
  selected: null,
  loading: false,
  error: null,
};

// Async
export const fetchInvoices = createAsyncThunk<ArInvoiceDto[]>(
  "invoices/getAll",
  async () => await service.getInvoices()
);

export const fetchInvoiceDetail = createAsyncThunk<ArInvoiceDto, number>(
  "invoices/getOne",
  async (id) => await service.getInvoiceById(id)
);

export const createInvoice = createAsyncThunk<ArInvoiceDto, CreateInvoiceDto>(
  "invoices/create",
  async (data) => await service.createInvoice(data)
);

export const updateInvoice = createAsyncThunk<
  ArInvoiceDto,
  { id: number; data: UpdateInvoiceDto }
>("invoices/update", async ({ id, data }) => await service.updateInvoice(id, data));

export const submitInvoice = createAsyncThunk<ArInvoiceDto, number>(
  "invoices/submit",
  async (id) => await service.submitInvoice(id)
);

export const approveInvoice = createAsyncThunk<ArInvoiceDto, number>(
  "invoices/approve",
  async (id) => await service.approveInvoice(id)
);

export const rejectInvoice = createAsyncThunk<
  ArInvoiceDto,
  { id: number; reason: string }
>("invoices/reject", async ({ id, reason }) => await service.rejectInvoice(id, reason));

// Slice
export const invoiceSlice = createSlice({
  name: "invoices",
  initialState,
  reducers: {
    clearSelected(state) {
      state.selected = null;
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(
      isFulfilled(
        fetchInvoices,
        fetchInvoiceDetail,
        createInvoice,
        updateInvoice,
        submitInvoice,
        approveInvoice,
        rejectInvoice
      ),
      (state, action: PayloadAction<ArInvoiceDto | ArInvoiceDto[]>) => {
        state.loading = false;
        state.error = null;

        if (Array.isArray(action.payload)) state.items = action.payload;
        else state.selected = action.payload;
      }
    );

    builder.addMatcher(
      isPending(
        fetchInvoices,
        fetchInvoiceDetail,
        createInvoice,
        updateInvoice,
        submitInvoice,
        approveInvoice,
        rejectInvoice
      ),
      (state) => {
        state.loading = true;
        state.error = null;
      }
    );

    builder.addMatcher(
      isRejected(
        fetchInvoices,
        fetchInvoiceDetail,
        createInvoice,
        updateInvoice,
        submitInvoice,
        approveInvoice,
        rejectInvoice
      ),
      (state, action) => {
        state.loading = false;
        state.error = action.error?.message ?? "Error occurred";
      }
    );
  },
});

export const { clearSelected } = invoiceSlice.actions;
export default invoiceSlice.reducer;
