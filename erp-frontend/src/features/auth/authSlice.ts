import { createSlice, PayloadAction ,createAsyncThunk} from "@reduxjs/toolkit";
import { User } from "../../types/User"
import * as authService from "./auth.service";
import { getErrorMessage } from "../../utils/ErrorHelper";
interface AuthState {
  accessToken: string | null;
  isAuthenticated: boolean;
  user?: User;
  loading: boolean;
  error?: string | null;
}

const initialState: AuthState = {
  accessToken: null,
  isAuthenticated: false,
  user: undefined,
  loading: true,
  error: null,
};
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

export const updateUserInfoThunk = createAsyncThunk(
  "auth/updateUserInfo",
  async (data: { full_name?: string; email?: string; phone?: string }, { rejectWithValue }) => {
    try {
      return await authService.updateUserInfo(data);
    } catch (err) {
     return rejectWithValue(getErrorMessage(err));
    }
  }
);

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
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateUserAvatarThunk.fulfilled, (state, action) => {
       if (state.user && action.payload?.avatar_url) {
          state.user.avatar_url = action.payload.avatar_url;
        }
      })
      .addCase(updateUserInfoThunk.fulfilled, (state, action) => {
        state.user = action.payload.user;
      })
      .addCase(updateUserAvatarThunk.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(updateUserInfoThunk.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { setToken, setUser, clearAuth , finishLoading} = authSlice.actions;
export default authSlice.reducer;
