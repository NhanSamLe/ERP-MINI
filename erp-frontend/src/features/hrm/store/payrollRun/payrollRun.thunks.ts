import { createAsyncThunk } from "@reduxjs/toolkit";
import { payrollRunApi } from "../../api/payrollRun.api";
import {
  PayrollRunDTO,
  PayrollRunFilter,
  PayrollRunLineDTO,
} from "../../dto/payrollRun.dto";

export const fetchPayrollRuns = createAsyncThunk(
  "payrollRun/fetchAll",
  async (filter: PayrollRunFilter | undefined) => {
    const res = await payrollRunApi.getAll(filter);
    return res.data as PayrollRunDTO[];
  }
);

export const fetchPayrollRunDetail = createAsyncThunk(
  "payrollRun/fetchDetail",
  async (id: number) => {
    const res = await payrollRunApi.getDetail(id);
    return res.data as PayrollRunDTO;
  }
);

export const createPayrollRunThunk = createAsyncThunk(
  "payrollRun/create",
  async (data: { period_id: number; run_no: string }) => {
    const res = await payrollRunApi.create(data);
    return res.data as PayrollRunDTO;
  }
);

export const cancelPayrollRunThunk = createAsyncThunk(
  "payrollRun/cancel",
  async (id: number) => {
    await payrollRunApi.cancel(id);
    return id;
  }
);

export const postPayrollRunThunk = createAsyncThunk(
  "payrollRun/post",
  async (id: number) => {
    const res = await payrollRunApi.postRun(id);
    return res.data as PayrollRunDTO;
  }
);

// ====== LINES ======

export const createPayrollRunLineThunk = createAsyncThunk(
  "payrollRun/createLine",
  async (payload: { runId: number; employee_id: number; amount: number }) => {
    const res = await payrollRunApi.createLine(payload.runId, {
      employee_id: payload.employee_id,
      amount: payload.amount,
    });
    return { runId: payload.runId, line: res.data as PayrollRunLineDTO };
  }
);

export const updatePayrollRunLineThunk = createAsyncThunk(
  "payrollRun/updateLine",
  async (payload: {
    runId: number;
    lineId: number;
    data: Partial<PayrollRunLineDTO>;
  }) => {
    const res = await payrollRunApi.updateLine(payload.lineId, payload.data);
    return { runId: payload.runId, line: res.data as PayrollRunLineDTO };
  }
);

export const deletePayrollRunLineThunk = createAsyncThunk(
  "payrollRun/deleteLine",
  async (payload: { runId: number; lineId: number }) => {
    await payrollRunApi.deleteLine(payload.lineId);
    return payload;
  }
);
