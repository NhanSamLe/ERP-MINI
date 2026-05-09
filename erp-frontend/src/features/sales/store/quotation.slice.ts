import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
  QuotationDto, CreateQuotationDto, UpdateQuotationDto,
} from "../dto/quotation.dto";
import * as service from "../service/quotation.service";

export interface QuotationState {
  items: QuotationDto[];
  selected: QuotationDto | null;
  loading: boolean;
  error: string | null;
}

const initialState: QuotationState = {
  items: [], selected: null, loading: false, error: null,
};

// ── Thunks ──────────────────────────────────────────────
export const fetchQuotations = createAsyncThunk<QuotationDto[]>(
  "quotations/getAll",
  async (_, { rejectWithValue }) => {
    try { return await service.getQuotations(); }
    catch (e: any) { return rejectWithValue(e?.response?.data?.message ?? e?.message ?? "Failed"); }
  }
);

export const fetchQuotationById = createAsyncThunk<QuotationDto, number>(
  "quotations/getOne",
  async (id, { rejectWithValue }) => {
    try { return await service.getQuotationById(id); }
    catch (e: any) { return rejectWithValue(e?.response?.data?.message ?? e?.message ?? "Failed"); }
  }
);

export const createQuotation = createAsyncThunk<QuotationDto, CreateQuotationDto>(
  "quotations/create",
  async (data, { rejectWithValue }) => {
    try { return await service.createQuotation(data); }
    catch (e: any) { return rejectWithValue(e?.response?.data?.message ?? e?.message ?? "Failed"); }
  }
);

export const updateQuotation = createAsyncThunk<QuotationDto, { id: number; data: UpdateQuotationDto }>(
  "quotations/update",
  async ({ id, data }, { rejectWithValue }) => {
    try { return await service.updateQuotation(id, data); }
    catch (e: any) { return rejectWithValue(e?.response?.data?.message ?? e?.message ?? "Failed"); }
  }
);

export const submitQuotation = createAsyncThunk<QuotationDto, number>(
  "quotations/submit",
  async (id, { rejectWithValue }) => {
    try { return await service.submitQuotation(id); }
    catch (e: any) { return rejectWithValue(e?.response?.data?.message ?? e?.message ?? "Failed"); }
  }
);

export const approveQuotation = createAsyncThunk<QuotationDto, number>(
  "quotations/approve",
  async (id, { rejectWithValue }) => {
    try { return await service.approveQuotation(id); }
    catch (e: any) { return rejectWithValue(e?.response?.data?.message ?? e?.message ?? "Failed"); }
  }
);

export const rejectQuotation = createAsyncThunk<QuotationDto, { id: number; reason: string }>(
  "quotations/reject",
  async ({ id, reason }, { rejectWithValue }) => {
    try { return await service.rejectQuotation(id, reason); }
    catch (e: any) { return rejectWithValue(e?.response?.data?.message ?? e?.message ?? "Failed"); }
  }
);

export const markAcceptedQuotation = createAsyncThunk<QuotationDto, number>(
  "quotations/accept",
  async (id, { rejectWithValue }) => {
    try { return await service.acceptQuotation(id); }
    catch (e: any) { return rejectWithValue(e?.response?.data?.message ?? e?.message ?? "Failed"); }
  }
);

export const convertQuotationToOrder = createAsyncThunk<{ id: number; order_no: string }, number>(
  "quotations/convertToOrder",
  async (id, { rejectWithValue }) => {
    try { return await service.convertQuotation(id); }
    catch (e: any) { return rejectWithValue(e?.response?.data?.message ?? e?.message ?? "Failed"); }
  }
);

// ── Slice ────────────────────────────────────────────────
const quotationSlice = createSlice({
  name: "quotations",
  initialState,
  reducers: {
    clearSelected(state) { state.selected = null; },
    clearError(state)    { state.error    = null; },
  },
  extraReducers: (builder) => {
    // ── fetchQuotations ──
    builder
      .addCase(fetchQuotations.pending,    (state)          => { state.loading = true;  state.error = null; })
      .addCase(fetchQuotations.fulfilled,  (state, action)  => { state.loading = false; state.items = action.payload; })
      .addCase(fetchQuotations.rejected,   (state, action)  => { state.loading = false; state.error = String(action.payload ?? action.error.message); });

    // ── fetchQuotationById ──
    builder
      .addCase(fetchQuotationById.pending,   (state)         => { state.loading = true;  state.error = null; })
      .addCase(fetchQuotationById.fulfilled, (state, action) => { state.loading = false; state.selected = action.payload; })
      .addCase(fetchQuotationById.rejected,  (state, action) => { state.loading = false; state.error = String(action.payload ?? action.error.message); });

    // ── createQuotation ──
    builder
      .addCase(createQuotation.pending,   (state)         => { state.loading = true;  state.error = null; })
      .addCase(createQuotation.fulfilled, (state, action) => { state.loading = false; state.selected = action.payload; state.items = [action.payload, ...state.items]; })
      .addCase(createQuotation.rejected,  (state, action) => { state.loading = false; state.error = String(action.payload ?? action.error.message); });

    // ── updateQuotation ──
    builder
      .addCase(updateQuotation.pending,   (state)         => { state.loading = true;  state.error = null; })
      .addCase(updateQuotation.fulfilled, (state, action) => {
        state.loading  = false;
        state.selected = action.payload;
        state.items    = state.items.map((q) => q.id === action.payload.id ? action.payload : q);
      })
      .addCase(updateQuotation.rejected,  (state, action) => { state.loading = false; state.error = String(action.payload ?? action.error.message); });

    // ── submitQuotation ──
    builder
      .addCase(submitQuotation.pending,   (state)         => { state.loading = true;  state.error = null; })
      .addCase(submitQuotation.fulfilled, (state, action) => {
        state.loading  = false;
        state.selected = action.payload;
        state.items    = state.items.map((q) => q.id === action.payload.id ? action.payload : q);
      })
      .addCase(submitQuotation.rejected,  (state, action) => { state.loading = false; state.error = String(action.payload ?? action.error.message); });

    // ── approveQuotation ──
    builder
      .addCase(approveQuotation.pending,   (state)         => { state.loading = true;  state.error = null; })
      .addCase(approveQuotation.fulfilled, (state, action) => {
        state.loading  = false;
        state.selected = action.payload;
        state.items    = state.items.map((q) => q.id === action.payload.id ? action.payload : q);
      })
      .addCase(approveQuotation.rejected,  (state, action) => { state.loading = false; state.error = String(action.payload ?? action.error.message); });

    // ── rejectQuotation ──
    builder
      .addCase(rejectQuotation.pending,   (state)         => { state.loading = true;  state.error = null; })
      .addCase(rejectQuotation.fulfilled, (state, action) => {
        state.loading  = false;
        state.selected = action.payload;
        state.items    = state.items.map((q) => q.id === action.payload.id ? action.payload : q);
      })
      .addCase(rejectQuotation.rejected,  (state, action) => { state.loading = false; state.error = String(action.payload ?? action.error.message); });

    // ── markAcceptedQuotation ──
    builder
      .addCase(markAcceptedQuotation.pending,   (state)         => { state.loading = true;  state.error = null; })
      .addCase(markAcceptedQuotation.fulfilled, (state, action) => {
        state.loading  = false;
        state.selected = action.payload;
        state.items    = state.items.map((q) => q.id === action.payload.id ? action.payload : q);
      })
      .addCase(markAcceptedQuotation.rejected,  (state, action) => { state.loading = false; state.error = String(action.payload ?? action.error.message); });

    // ── convertQuotationToOrder ──
    builder
      .addCase(convertQuotationToOrder.pending,   (state)        => { state.loading = true;  state.error = null; })
      .addCase(convertQuotationToOrder.fulfilled, (state)        => { state.loading = false; })
      .addCase(convertQuotationToOrder.rejected,  (state, action)=> { state.loading = false; state.error = String(action.payload ?? action.error.message); });
  },
});

export const { clearSelected, clearError } = quotationSlice.actions;
export default quotationSlice.reducer;
