import { createAsyncThunk } from "@reduxjs/toolkit";
import * as userService from "../user.service";
import { getErrorMessage } from "../../../utils/ErrorHelper";

export const fetchAllUsers = createAsyncThunk("user/fetchAllUsers", async (_, { rejectWithValue }) => {
  try {
    const response = await userService.getAllUsers();
    return response;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

export const fetchAllRoles = createAsyncThunk("user/fetchAllRoles", async (_, { rejectWithValue }) => {
  try {
    const response = await userService.getAllRoles();
        return response;
    } catch (error) {
        return rejectWithValue(getErrorMessage(error));
    }
});

export const createUserThunk = createAsyncThunk(
  "user/createUser",
  async (
    data: {
      branch_id: number;
      username: string;
      password: string;
      full_name?: string;
      email?: string;
      phone?: string;
      role_id: number;
    },
    { rejectWithValue }
  ) => {
    try {
      return await userService.createUser(data);
    } catch (err) {
      return rejectWithValue(getErrorMessage(err));
    }
  }
);

// Cập nhật người dùng
export const updateUserThunk = createAsyncThunk(
  "user/updateUser",
  async (
    data: {
      username: string;
      full_name?: string;
      email?: string;
      phone?: string;
      role_id?: number;
      branch_id?: number;
    },
    { rejectWithValue }
  ) => {
    try {
      return await userService.updateUser(data);
    } catch (err) {
      return rejectWithValue(getErrorMessage(err));
    }
  }
);

// Xóa người dùng
export const deleteUserThunk = createAsyncThunk(
  "user/deleteUser",
  async (id: number, { rejectWithValue }) => {
    try {
      return await userService.deleteUser(id);
    } catch (err) {
      return rejectWithValue(getErrorMessage(err));
    }
  }
);
