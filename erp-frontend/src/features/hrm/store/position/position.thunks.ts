// src/features/hrm/store/position/position.thunks.ts
import { createAsyncThunk } from "@reduxjs/toolkit";
import type { PositionDTO, PositionFilter } from "../../dto/position.dto";
import {
  fetchPositions,
  createPosition,
  updatePosition,
} from "../../service/position.service";
import axiosClient from "@/api/axiosClient";

// Load list
export const loadPositions = createAsyncThunk(
  "position/loadPositions",
  async (filter: PositionFilter | undefined, { rejectWithValue }) => {
    try {
      return await fetchPositions(filter);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Error loading positions";
      return rejectWithValue(msg);
    }
  }
);

// Create
export const addPosition = createAsyncThunk<
  any,
  PositionDTO,
  { rejectValue: string }
>("position/addPosition", async (data, { rejectWithValue }) => {
  try {
    return await createPosition(data);
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Error creating position";
    return rejectWithValue(msg); // 👈 unwrap() sẽ nhận string này
  }
});

// Update
export const editPosition = createAsyncThunk<
  any,
  { id: number; data: Partial<PositionDTO> },
  { rejectValue: string }
>("position/editPosition", async ({ id, data }, { rejectWithValue }) => {
  try {
    return await updatePosition(id, data);
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Error updating position";
    return rejectWithValue(msg);
  }
});

export const togglePositionStatus = createAsyncThunk(
  "position/toggleStatus",
  async (
    { id, status }: { id: number; status: "active" | "inactive" },
    { rejectWithValue }
  ) => {
    try {
      return await axiosClient.patch(`/hrm/positions/${id}/status`, {
        status,
      });
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.message || "Error updating status"
      );
    }
  }
);
