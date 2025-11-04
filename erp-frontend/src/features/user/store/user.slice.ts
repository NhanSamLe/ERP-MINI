import {createSlice, PayloadAction} from "@reduxjs/toolkit";
import { User , Role} from "../../../types/User"
import { UserState } from "./user.types";
import { fetchAllUsers, fetchAllRoles, createUserThunk, updateUserThunk, deleteUserThunk } from "./user.thunks";

const initialState:UserState = {
  users: [],
  roles: [],
  loading: false,
  error: null
};
const userSlice =  createSlice({
  name: "user",
  initialState,
    reducers: {
    setUsers(state, action: PayloadAction<User[]>) {
      state.users = action.payload;
    },
    setRoles(state, action: PayloadAction<Role[]>) {
      state.roles = action.payload;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    },
    extraReducers: (builder) => {
        builder
        .addCase(fetchAllUsers.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(fetchAllUsers.fulfilled, (state, action: PayloadAction<User[]>) => {
            state.users = action.payload;
            state.loading = false;
        })
        .addCase(fetchAllUsers.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        })

        .addCase(fetchAllRoles.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(fetchAllRoles.fulfilled, (state, action: PayloadAction<Role[]>) => {
            state.roles = action.payload;
            state.loading = false;
        })
        .addCase(fetchAllRoles.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        })
        .addCase(createUserThunk.fulfilled, (state, action) => {
        state.users.push(action.payload);
        })
        .addCase(createUserThunk.rejected, (state, action) => {
            state.error = action.payload as string;
        })
        .addCase(updateUserThunk.fulfilled, (state, action) => {
            const index = state.users.findIndex(user => user.id === action.payload.id);
            if (index !== -1) {
                state.users[index] = action.payload;
            }
        })
        .addCase(updateUserThunk.rejected, (state, action) => {
            state.error = action.payload as string;
        })
        .addCase(deleteUserThunk.fulfilled, (state, action) => {
            state.users = state.users.filter(user => user.id !== action.payload);
        })
        .addCase(deleteUserThunk.rejected, (state, action) => {
            state.error = action.payload as string;
        });
    }
});
export const { setUsers, setRoles, setLoading, setError } = userSlice.actions;

export default userSlice.reducer;
