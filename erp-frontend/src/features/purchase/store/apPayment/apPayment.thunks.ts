import { createAsyncThunk } from "@reduxjs/toolkit";
import { ApPayment } from "./apPayment.types";
import { apPaymentService } from "../services/apPayment.service";
import { getErrorMessage } from "@/utils/ErrorHelper";

/* ===== GET ALL ===== */
export const getAllApPaymentsThunk = createAsyncThunk<
  ApPayment[],
  void,
  { rejectValue: string }
>("apPayment/getAll", async (_, { rejectWithValue }) => {
  try {
    return await apPaymentService.getAll();
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

/* ===== GET BY ID ===== */
export const getApPaymentByIdThunk = createAsyncThunk<
  ApPayment,
  number,
  { rejectValue: string }
>("apPayment/getById", async (id, { rejectWithValue }) => {
  try {
    return await apPaymentService.getById(id);
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

/* ===== CREATE ===== */
export const createApPaymentThunk = createAsyncThunk<
  ApPayment,
  Partial<ApPayment>,
  { rejectValue: string }
>("apPayment/create", async (payload, { rejectWithValue }) => {
  try {
    return await apPaymentService.create(payload);
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

/* ===== SUBMIT ===== */
export const submitApPaymentThunk = createAsyncThunk<
  ApPayment,
  number,
  { rejectValue: string }
>("apPayment/submit", async (id, { rejectWithValue }) => {
  try {
    return await apPaymentService.submit(id);
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

/* ===== APPROVE ===== */
export const approveApPaymentThunk = createAsyncThunk<
  ApPayment,
  number,
  { rejectValue: string }
>("apPayment/approve", async (id, { rejectWithValue }) => {
  try {
    return await apPaymentService.approve(id);
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

/* ===== REJECT ===== */
export const rejectApPaymentThunk = createAsyncThunk<
  ApPayment,
  { id: number; reason: string },
  { rejectValue: string }
>("apPayment/reject", async ({ id, reason }, { rejectWithValue }) => {
  try {
    return await apPaymentService.reject(id, reason);
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});
