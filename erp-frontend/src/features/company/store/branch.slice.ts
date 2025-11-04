import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { BranchState } from "./branch.types";
import { Branch } from "./branch.types";
import { fetchAllBranchesThunk } from "./branch.thunks";

const initialState: BranchState = {
  branches: [],
  loading: false,
  error: null,
};
const branchSlice = createSlice({
    name: "branch", 
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
        .addCase(fetchAllBranchesThunk.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(fetchAllBranchesThunk.fulfilled, (state, action: PayloadAction<Branch[]>) => {
            console.log("✅ Fetched branches:", action.payload);
            state.branches = action.payload;
            state.loading = false;
        })
        .addCase(fetchAllBranchesThunk.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        }); 
    },
});
export default branchSlice.reducer;

    