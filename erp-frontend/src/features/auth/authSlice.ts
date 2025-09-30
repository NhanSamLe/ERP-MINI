import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { User } from "../../types/User"
interface AuthState {
  accessToken: string | null;
  isAuthenticated: boolean;
  user?: User;
  loading: boolean; 
}

const initialState: AuthState = {
  accessToken: null,
  isAuthenticated: false,
  user: undefined,
  loading: true, 
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
    }
  },
});

export const { setToken, setUser, clearAuth , finishLoading} = authSlice.actions;
export default authSlice.reducer;
