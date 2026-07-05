import { createAsyncThunk } from "@reduxjs/toolkit";
import { purchaseOrderService } from "./services/purchaseOrder.service";
import {
  PurchaseOrder,
  PurchaseOrderCreate,
  PurchaseOrderUpdate,
} from "./purchaseOrder.types";
import { getErrorMessage } from "@/utils/ErrorHelper";

export const fetchPurchaseOrdersThunk = createAsyncThunk(
  "purchaseOrder/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await purchaseOrderService.getAllPO();
      return res;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const getPurchaseOrdersAvailableForInvoiceThunk = createAsyncThunk<
  PurchaseOrder[],
  void,
  { rejectValue: string }
>("purchaseOrder/getAvailableForInvoice", async (_, { rejectWithValue }) => {
  try {
    return await purchaseOrderService.getAvailableForInvoice();
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

export const fetchPurchaseOrderByIdThunk = createAsyncThunk(
  "purchaseOrder/fetchOne",
  async (id: number, { rejectWithValue }) => {
    try {
      const res = await purchaseOrderService.getPOById(id);
      return res;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const fetchPurchaseOrderByStatus = createAsyncThunk(
  "purchaseOrder/fetchByStatus",
  async (status: string, { rejectWithValue }) => {
    try {
      const res = await purchaseOrderService.getPOByStatus(status);
      return res;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const createPurchaseOrderThunk = createAsyncThunk(
  "purchaseOrder/create",
  async (body: PurchaseOrderCreate, { rejectWithValue }) => {
    try {
      const res = await purchaseOrderService.create(body);
      return res;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const updatePurchaseOrderThunk = createAsyncThunk(
  "purchaseOrder/update",
  async (
    { id, body }: { id: number; body: PurchaseOrderUpdate },
    { rejectWithValue },
  ) => {
    try {
      const res = await purchaseOrderService.update(id, body);
      return res;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const deletePurchaseOrderThunk = createAsyncThunk(
  "purchaseOrder/delete",
  async (id: number, { rejectWithValue }) => {
    try {
      await purchaseOrderService.delete(id);
      return id;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const submitPurchaseOrderThunk = createAsyncThunk(
  "purchaseOrder/submitApproval",
  async (id: number, { rejectWithValue }) => {
    try {
      const res = await purchaseOrderService.submitForApproval(id);
      return res;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const approvePurchaseOrderThunk = createAsyncThunk(
  "purchaseOrder/approve",
  async (id: number) => {
    return await purchaseOrderService.approve(id);
  },
);

export const cancelPurchaseOrderThunk = createAsyncThunk(
  "purchaseOrder/cancel",
  async ({ id, reason }: { id: number; reason: string }) => {
    return await purchaseOrderService.cancel(id, reason);
  },
);

// ================= SEARCH =================
export const searchPurchaseOrdersThunk = createAsyncThunk<
  { items: PurchaseOrder[]; pagination: any },
  any,
  { rejectValue: string }
>("purchaseOrder/search", async (filters, { rejectWithValue }) => {
  try {
    return await purchaseOrderService.search(filters);
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

// ================= BULK APPROVE =================
export const bulkApprovePurchaseOrdersThunk = createAsyncThunk<
  any,
  number[],
  { rejectValue: string }
>("purchaseOrder/bulkApprove", async (po_ids, { rejectWithValue }) => {
  try {
    return await purchaseOrderService.bulkApprove(po_ids);
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

// ================= BULK CANCEL =================
export const bulkCancelPurchaseOrdersThunk = createAsyncThunk<
  any,
  { po_ids: number[]; reason: string },
  { rejectValue: string }
>(
  "purchaseOrder/bulkCancel",
  async ({ po_ids, reason }, { rejectWithValue }) => {
    try {
      return await purchaseOrderService.bulkCancel(po_ids, reason);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

// ================= AUDIT LOGS =================
export const fetchPurchaseOrderAuditLogsThunk = createAsyncThunk<
  any[],
  number,
  { rejectValue: string }
>("purchaseOrder/fetchAuditLogs", async (id, { rejectWithValue }) => {
  try {
    return await purchaseOrderService.getAuditLogs(id);
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

// ================= SEND EMAIL =================
export const sendPurchaseOrderEmailThunk = createAsyncThunk<
  { success: boolean; message: string; po: PurchaseOrder },
  number,
  { rejectValue: string }
>("purchaseOrder/sendEmail", async (id, { rejectWithValue }) => {
  try {
    return await purchaseOrderService.sendEmail(id);
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});
