// src/store/slices/receipt.slice.ts
import { createSlice, createAsyncThunk, PayloadAction, isPending, isFulfilled, isRejected } from "@reduxjs/toolkit";
import {
  ArReceiptDto,
  CreateReceiptDto,
  UpdateReceiptDto,
  AllocateReceiptDto,
} from "../dto/receipt.dto";
import * as service from "../service/receipt.service";

interface ReceiptState {
  items: ArReceiptDto[];
  selected: ArReceiptDto | null;
  loading: boolean;
  error: string | null;
}

const initialState: ReceiptState = {
  items: [],
  selected: null,
  loading: false,
  error: null,
};

// Async
export const fetchReceipts = createAsyncThunk<ArReceiptDto[]>(
  "receipts/getAll",
  async () => await service.getReceipts()
);

export const fetchReceiptDetail = createAsyncThunk<ArReceiptDto, number>(
  "receipts/getOne",
  async (id) => await service.getReceiptById(id)
);

export const createReceipt = createAsyncThunk<ArReceiptDto, CreateReceiptDto>(
  "receipts/create",
  async (data) => await service.createReceipt(data)
);

export const updateReceipt = createAsyncThunk<
  ArReceiptDto,
  { id: number; data: UpdateReceiptDto }
>("receipts/update", async ({ id, data }) => await service.updateReceipt(id, data));

export const submitReceipt = createAsyncThunk<ArReceiptDto, number>(
  "receipts/submit",
  async (id) => await service.submitReceipt(id)
);

export const approveReceipt = createAsyncThunk<ArReceiptDto, number>(
  "receipts/approve",
  async (id) => await service.approveReceipt(id)
);

export const rejectReceipt = createAsyncThunk<
  ArReceiptDto,
  { id: number; reason: string }
>("receipts/reject", async ({ id, reason }) => await service.rejectReceipt(id, reason));

export const allocateReceipt = createAsyncThunk<
  ArReceiptDto,
  { id: number; allocations: AllocateReceiptDto[] }
>("receipts/allocate", async ({ id, allocations }) => {
  return await service.allocateReceipt(id, allocations);
});

// Slice
export const receiptSlice = createSlice({
  name: "receipts",
  initialState,
  reducers: {
    clearSelected(state) {
      state.selected = null;
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(
      isFulfilled(
        fetchReceipts,
        fetchReceiptDetail,
        createReceipt,
        updateReceipt,
        submitReceipt,
        approveReceipt,
        rejectReceipt,
        allocateReceipt
      ),
      (state, action: PayloadAction<ArReceiptDto | ArReceiptDto[]>) => {
        state.loading = false;
        state.error = null;

        if (Array.isArray(action.payload)) state.items = action.payload;
        else state.selected = action.payload;
      }
    );

    builder.addMatcher(
      isPending(
        fetchReceipts,
        fetchReceiptDetail,
        createReceipt,
        updateReceipt,
        submitReceipt,
        approveReceipt,
        rejectReceipt,
        allocateReceipt
      ),
      (state) => {
        state.loading = true;
        state.error = null;
      }
    );

    builder.addMatcher(
      isRejected(
        fetchReceipts,
        fetchReceiptDetail,
        createReceipt,
        updateReceipt,
        submitReceipt,
        approveReceipt,
        rejectReceipt,
        allocateReceipt
      ),
      (state, action) => {
        state.loading = false;
        state.error = action.error?.message ?? "Error occurred";
      }
    );
  },
});

export const { clearSelected } = receiptSlice.actions;
export default receiptSlice.reducer;
