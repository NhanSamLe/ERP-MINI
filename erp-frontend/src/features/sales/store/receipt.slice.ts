// src/store/slices/receipt.slice.ts
import { createSlice, createAsyncThunk, PayloadAction, isPending, isFulfilled, isRejected } from "@reduxjs/toolkit";
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
export const fetchUnpaidInvoices = createAsyncThunk<
  UnpaidInvoiceDto[],
  number
>("receipts/unpaidInvoices", async (customerId) => {
  return await service.getCustomerUnpaidInvoicesService(customerId);
});
export const fetchFilteredReceipts = createAsyncThunk(
  "receipts/filter",
  async (filters: ReceiptFilterDto) => {
    return await service.searchReceipts(filters);
  }
);
export const fetchCustomersWithDebt = createAsyncThunk<
  CustomerWithDebtDto[]
>("receipts/customersDebt", async () => {
  return await service.getCustomersWithDebtService();
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
    builder.addCase(fetchCustomersWithDebt.fulfilled, (state, action) => {
      state.customersWithDebt = action.payload;
    });
    builder.addCase(fetchUnpaidInvoices.fulfilled, (state, action) => {
    state.unpaidInvoices = action.payload;
  });
  builder.addCase(fetchFilteredReceipts.fulfilled, (state, action) => {
      state.loading = false;
      state.error = null;

  
      state.items = action.payload.items;
      state.total = action.payload.total;
      state.page = action.payload.page;
      state.page_size = action.payload.page_size;
      state.total_pages = action.payload.total_pages;
    });

    builder.addMatcher(
      isFulfilled(
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
