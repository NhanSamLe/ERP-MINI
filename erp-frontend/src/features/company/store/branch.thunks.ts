import { createAsyncThunk } from "@reduxjs/toolkit";
import * as branchService from "../branch.service";
import { getErrorMessage } from "../../../utils/ErrorHelper";


export const fetchAllBranchesThunk = createAsyncThunk<Branch[]>(
  "branch/fetchAllBranches",
  async (_, { rejectWithValue }) => {
    try {
      const response = await branchService.fetchBranches();
      return response as Branch[];
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

