import { createSlice } from "@reduxjs/toolkit";
import {
  loadDepartments,
  createDepartmentThunk,
  updateDepartmentThunk,
  deleteDepartmentThunk,
} from "./department.thunks";
import { Department } from "./department.type";

interface DepartmentState {
  items: Department[];
  loading: boolean;
}

const initialState: DepartmentState = {
  items: [],
  loading: false,
};

const departmentSlice = createSlice({
  name: "hrmDepartment",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadDepartments.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadDepartments.fulfilled, (state, action) => {
        state.items = action.payload;
        state.loading = false;
      })
      .addCase(createDepartmentThunk.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(updateDepartmentThunk.fulfilled, (state, action) => {
        const idx = state.items.findIndex((d) => d.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(deleteDepartmentThunk.fulfilled, (state, action) => {
        state.items = state.items.filter((d) => d.id !== action.payload);
      });
  },
});

export const departmentReducer = departmentSlice.reducer;
export default departmentSlice.reducer;
