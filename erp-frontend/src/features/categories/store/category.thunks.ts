import { createAsyncThunk } from "@reduxjs/toolkit";
import { categoryService } from "../category.service";
import {
  CategoryCreate,
  CategoryUpdate,
  ProductCategory,
} from "./category.types";

export const fetchCategoriesThunk = createAsyncThunk(
  "category/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      return await categoryService.getAll();
    } catch (error: unknown) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }
);

export const fetchCategoryByIdThunk = createAsyncThunk<ProductCategory, number>(
  "category/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      return await categoryService.getById(id);
    } catch (error: unknown) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }
);

export const createCategoryThunk = createAsyncThunk(
  "category/create",
  async (body: CategoryCreate, { rejectWithValue }) => {
    try {
      return await categoryService.create(body);
    } catch (error: unknown) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }
);

export const updateCategoryThunk = createAsyncThunk(
  "category/update",
  async (
    { id, body }: { id: number; body: CategoryUpdate },
    { rejectWithValue }
  ) => {
    try {
      return await categoryService.update(id, body);
    } catch (error: unknown) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }
);

export const deleteCategoryThunk = createAsyncThunk<number, number>(
  "category/delete",
  async (id, { rejectWithValue }) => {
    try {
      await categoryService.delete(id);
      return id;
    } catch (error: unknown) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }
);
