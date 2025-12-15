import { createAsyncThunk } from "@reduxjs/toolkit";
import { apInvoiceApi } from "../../api/apInvoice.api";
import { ApInvoice, ApPostedSummary } from "./apInvoice.types";
import { getErrorMessage } from "@/utils/ErrorHelper";
import { apInvoiceService } from "../services/apInvoice.service";
import { Partner } from "@/features/partner/store/partner.types";

/* ================= GET ALL ================= */
export const getAllApInvoicesThunk = createAsyncThunk<
  ApInvoice[],
  void,
  { rejectValue: string }
>("apInvoice/getAll", async (_, { rejectWithValue }) => {
  try {
    return await apInvoiceApi.getAll();
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

/* ================= GET BY ID ================= */
export const getApInvoiceByIdThunk = createAsyncThunk<
  ApInvoice,
  number,
  { rejectValue: string }
>("apInvoice/getById", async (id, { rejectWithValue }) => {
  try {
    return await apInvoiceApi.getById(id);
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

/* ================= CREATE ================= */
export const createApInvoiceFromPoThunk = createAsyncThunk<
  ApInvoice,
  number,
  { rejectValue: string }
>("apInvoice/createFromPO", async (poId, { rejectWithValue }) => {
  try {
    return await apInvoiceService.createFromPO(poId);
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

/* ================= SUBMIT ================= */
export const submitApInvoiceThunk = createAsyncThunk<
  ApInvoice,
  number,
  { rejectValue: string }
>("apInvoice/submit", async (id, { rejectWithValue }) => {
  try {
    return await apInvoiceApi.submitForApproval(id);
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

/* ================= APPROVE ================= */
export const approveApInvoiceThunk = createAsyncThunk<
  ApInvoice,
  number,
  { rejectValue: string }
>("apInvoice/approve", async (id, { rejectWithValue }) => {
  try {
    return await apInvoiceApi.approve(id);
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

/* ================= REJECT ================= */
export const rejectApInvoiceThunk = createAsyncThunk<
  ApInvoice,
  { id: number; reason: string },
  { rejectValue: string }
>("apInvoice/reject", async ({ id, reason }, { rejectWithValue }) => {
  try {
    return await apInvoiceApi.reject(id, reason);
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

export const fetchApPostedSummaryThunk = createAsyncThunk<
  ApPostedSummary,
  number,
  { rejectValue: string }
>("apInvoice/fetchPostedSummary", async (supplierId, { rejectWithValue }) => {
  try {
    return await apInvoiceService.getPostedSummaryBySupplier(supplierId);
  } catch (e) {
    return rejectWithValue(getErrorMessage(e));
  }
});

export const fetchPostedSuppliersThunk = createAsyncThunk<
  Partner[],
  void,
  { rejectValue: string }
>("apInvoice/fetchPostedSuppliers", async (_, { rejectWithValue }) => {
  try {
    return await apInvoiceService.getPostedSuppliers();
  } catch (e) {
    return rejectWithValue(getErrorMessage(e));
  }
});
