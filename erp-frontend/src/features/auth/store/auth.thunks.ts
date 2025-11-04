import { createAsyncThunk } from "@reduxjs/toolkit";
import * as authService from "../auth.service";
import { getErrorMessage } from "../../../utils/ErrorHelper";

// ✅ Cập nhật ảnh đại diện
export const updateUserAvatarThunk = createAsyncThunk(
  "auth/updateUserAvatar",
  async (formData: FormData, { rejectWithValue }) => {
    try {
      return await authService.updateUserAvatar(formData);
    } catch (err) {
      return rejectWithValue(getErrorMessage(err));
    }
  }
);

// ✅ Cập nhật thông tin người dùng
export const updateUserInfoThunk = createAsyncThunk(
  "auth/updateUserInfo",
  async (
    data: { full_name?: string; email?: string; phone?: string },
    { rejectWithValue }
  ) => {
    try {
      return await authService.updateUserInfo(data);
    } catch (err) {
      return rejectWithValue(getErrorMessage(err));
    }
  }
);
