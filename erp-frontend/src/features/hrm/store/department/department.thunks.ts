// src/features/hrm/store/department/department.thunks.ts
import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosClient from "../../../../api/axiosClient";
import { Department } from "./department.type";

export interface DepartmentFilter {
  search?: string;
  branch_id?: number;
}

const BASE_URL = "/hrm/departments";

// GET
export const loadDepartments = createAsyncThunk<
  Department[],
  DepartmentFilter | undefined,
  { rejectValue: string }
>("hrmDepartment/load", async (filter, { rejectWithValue }) => {
  try {
    const res = await axiosClient.get<Department[]>(BASE_URL, {
      params: filter,
    });
    return res.data;
  } catch (e: any) {
    const msg = e?.response?.data?.message || e.message || "Error loading departments";
    return rejectWithValue(msg);
  }
});

// POST
export const createDepartmentThunk = createAsyncThunk<
  Department,
  Omit<Department, "id">,
  { rejectValue: string }
>("hrmDepartment/create", async (payload, { rejectWithValue }) => {
  try {
    const res = await axiosClient.post<Department>(BASE_URL, payload);
    return res.data;
  } catch (e: any) {
    const msg = e?.response?.data?.message || e.message || "Error creating department";
    return rejectWithValue(msg);
  }
});

// PUT
export const updateDepartmentThunk = createAsyncThunk<
  Department,
  { id: number; data: Partial<Department> },
  { rejectValue: string }
>("hrmDepartment/update", async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await axiosClient.put<Department>(`${BASE_URL}/${id}`, data);
    return res.data;
  } catch (e: any) {
    const msg = e?.response?.data?.message || e.message || "Error updating department";
    return rejectWithValue(msg);
  }
});

// DELETE
export const deleteDepartmentThunk = createAsyncThunk<
  number,
  number,
  { rejectValue: string }
>("hrmDepartment/delete", async (id, { rejectWithValue }) => {
  try {
    await axiosClient.delete(`${BASE_URL}/${id}`);
    return id;
  } catch (e: any) {
    const msg = e?.response?.data?.message || e.message || "Error deleting department";
    return rejectWithValue(msg);
  }
});
