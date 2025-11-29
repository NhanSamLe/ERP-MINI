import { createAsyncThunk } from "@reduxjs/toolkit";
import { payrollItemApi } from "../../api/payrollItem.api";
import {
  PayrollItemDTO,
  PayrollItemFilter,
} from "../../dto/payrollItem.dto";

export const fetchPayrollItems = createAsyncThunk(
  "payrollItem/fetchAll",
  async (filter: PayrollItemFilter | undefined) => {
    const res = await payrollItemApi.getAll(filter);
    return res.data as PayrollItemDTO[];
  }
);

export const createPayrollItemThunk = createAsyncThunk(
  "payrollItem/create",
  async (data: PayrollItemDTO, { rejectWithValue }) => {
    try {
      const res = await payrollItemApi.create(data);
      return res.data as PayrollItemDTO;
    } catch (err: any) {
      return rejectWithValue(err.response?.data || { message: "Create failed" });
    }
  }
);

export const updatePayrollItemThunk = createAsyncThunk(
  "payrollItem/update",
  async (
    { id, data }: { id: number; data: Partial<PayrollItemDTO> },
    { rejectWithValue }
  ) => {
    try {
      const res = await payrollItemApi.update(id, data);
      return res.data as PayrollItemDTO;
    } catch (err: any) {
      return rejectWithValue(err.response?.data || { message: "Update failed" });
    }
  }
);

export const deletePayrollItemThunk = createAsyncThunk(
  "payrollItem/delete",
  async (id: number, { rejectWithValue }) => {
    try {
      await payrollItemApi.remove(id);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data || { message: "Delete failed" });
    }
  }
);
