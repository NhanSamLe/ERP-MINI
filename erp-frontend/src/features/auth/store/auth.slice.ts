import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AuthState } from "./auth.types";
import { User } from "../../../types/User";
import { updateUserAvatarThunk, updateUserInfoThunk } from "./auth.thunks";

const initialState: AuthState = {
  accessToken: null,
  isAuthenticated: false,
  user: undefined,
  loading: true,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
      state.isAuthenticated = true;
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
    clearAuth: (state) => {
      state.accessToken = null;
      state.isAuthenticated = false;
      state.user = undefined;
    },
    finishLoading: (state) => {
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Avatar
      .addCase(updateUserAvatarThunk.fulfilled, (state, action) => {
        if (state.user && action.payload?.avatar_url) {
          state.user.avatar_url = action.payload.avatar_url;
        }
      })
      .addCase(updateUserAvatarThunk.rejected, (state, action) => {
        state.error = action.payload as string;
      })

      // Info
      .addCase(updateUserInfoThunk.fulfilled, (state, action) => {
        state.user = action.payload.user;
      })
      .addCase(updateUserInfoThunk.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { setToken, setUser, clearAuth, finishLoading } = authSlice.actions;
export default authSlice.reducer;
