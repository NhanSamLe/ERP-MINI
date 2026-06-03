import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { payrollPeriodApi } from "../../api/payrollPeriod.api";
import {
  PayrollPeriodDTO,
  PayrollPeriodFilter,
} from "../../dto/payrollPeriod.dto";

export const fetchPayrollPeriods = createAsyncThunk(
  "payrollPeriod/fetchAll",
  async (filter: PayrollPeriodFilter | undefined) => {
    const res = await payrollPeriodApi.getAll(filter);
    return res.data;
  }
);

export const createPayrollPeriodThunk = createAsyncThunk(
  "payrollPeriod/create",
  async (data: PayrollPeriodDTO, { rejectWithValue }) => {
    try {
      const res = await payrollPeriodApi.create(data);
      return res.data;
    } catch (err: any) {
      if (axios.isAxiosError(err)) {
        return rejectWithValue(
          err.response?.data?.message || "Failed to create payroll period"
        );
      }
      return rejectWithValue("Failed to create payroll period");
    }
  }
);

export const updatePayrollPeriodThunk = createAsyncThunk(
  "payrollPeriod/update",
  async (
    { id, data }: { id: number; data: Partial<PayrollPeriodDTO> },
    { rejectWithValue }
  ) => {
    try {
      const res = await payrollPeriodApi.update(id, data);
      return res.data;
    } catch (err: any) {
      if (axios.isAxiosError(err)) {
        return rejectWithValue(
          err.response?.data?.message || "Failed to update payroll period"
        );
      }
      return rejectWithValue("Failed to update payroll period");
    }
  }
);

export const closePayrollPeriodThunk = createAsyncThunk(
  "payrollPeriod/close",
  async (id: number, { rejectWithValue }) => {
    try {
      await payrollPeriodApi.close(id);
      return id;
    } catch (err: any) {
      if (axios.isAxiosError(err)) {
        return rejectWithValue(
          err.response?.data?.message || "Failed to close payroll period"
        );
      }
      return rejectWithValue("Failed to close payroll period");
    }
  }
);

export const deletePayrollPeriodThunk = createAsyncThunk(
  "payrollPeriod/delete",
  async (id: number, { rejectWithValue }) => {
    try {
      await payrollPeriodApi.remove(id);
      return id;
    } catch (err: any) {
      if (axios.isAxiosError(err)) {
        return rejectWithValue(
          err.response?.data?.message || "Failed to delete payroll period"
        );
      }
      return rejectWithValue("Failed to delete payroll period");
    }
  }
);
