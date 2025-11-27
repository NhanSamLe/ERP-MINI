import { createAsyncThunk } from "@reduxjs/toolkit";
import { employeeApi } from "../../api/employee.api";
import {
  EmployeeDTO,
  EmployeeFilter,
  EmployeeFormPayload,
} from "../../dto/employee.dto";

// Lấy danh sách
export const fetchEmployees = createAsyncThunk(
  "employee/fetchAll",
  async (filter: EmployeeFilter) => {
    const res = await employeeApi.getAll(filter);
    return res.data as EmployeeDTO[];
  }
);

// Tạo nhân viên
export const createEmployee = createAsyncThunk(
  "employee/create",
  async (data: EmployeeFormPayload) => {
    const res = await employeeApi.create(data);
    return res.data as EmployeeDTO;
  }
);

// Cập nhật nhân viên
export const updateEmployee = createAsyncThunk(
  "employee/update",
  async ({ id, data }: { id: number; data: EmployeeFormPayload }) => {
    const res = await employeeApi.update(id, data);
    return res.data as EmployeeDTO;
  }
);

// Xoá nhân viên
export const deleteEmployee = createAsyncThunk(
  "employee/delete",
  async (id: number) => {
    await employeeApi.remove(id);
    return id;
  }
);
