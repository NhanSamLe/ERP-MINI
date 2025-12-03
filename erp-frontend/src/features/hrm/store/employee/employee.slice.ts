import { createSlice } from "@reduxjs/toolkit";
import { fetchEmployees, createEmployee, updateEmployee, deleteEmployee } from "./employee.thunks";
import { EmployeeType } from "./employee.type";

interface EmployeeState {
  employees: EmployeeType[];
  loading: boolean;
}

const initialState: EmployeeState = {
  employees: [],
  loading: false,
};

export const employeeSlice = createSlice({
  name: "employee",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmployees.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchEmployees.fulfilled, (state, action) => {
        state.loading = false;
        state.employees = action.payload;
      })
      .addCase(createEmployee.fulfilled, (state, action) => {
        state.employees.push(action.payload);
      })
      .addCase(updateEmployee.fulfilled, (state, action) => {
        state.employees = state.employees.map((e) =>
          e.id === action.payload.id ? action.payload : e
        );
      })
      .addCase(deleteEmployee.fulfilled, (state, action) => {
        state.employees = state.employees.filter((e) => e.id !== action.payload);
      });
  },
});

export const employeeReducer = employeeSlice.reducer;
