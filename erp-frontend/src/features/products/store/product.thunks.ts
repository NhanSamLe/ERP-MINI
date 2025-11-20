import { createAsyncThunk } from "@reduxjs/toolkit";
import { productApi } from "../api/product.api";
import { Product } from "../../products/store/product.types";

export const fetchProductsThunk = createAsyncThunk(
  "product/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      return await productApi.getAllProducts();
    } catch (error: unknown) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("Unknown error");
    }
  }
);

export const fetchProductByIdThunk = createAsyncThunk<Product, number>(
  "product/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      return await productApi.getProductById(id);
    } catch (error: unknown) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("Unknown error");
    }
  }
);

export const createProductThunk = createAsyncThunk(
  "product/create",
  async (formData: FormData, { rejectWithValue }) => {
    try {
      return await productApi.createProduct(formData);
    } catch (error: unknown) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("Unknown error");
    }
  }
);

export const updateProductThunk = createAsyncThunk(
  "product/update",
  async (
    { id, formData }: { id: number; formData: FormData },
    { rejectWithValue }
  ) => {
    try {
      return await productApi.updateProduct(id, formData);
    } catch (error: unknown) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("Unknown error");
    }
  }
);

export const deleteProductThunk = createAsyncThunk<number, number>(
  "product/delete",
  async (id, { rejectWithValue }) => {
    try {
      await productApi.deleteProduct(id);
      return id;
    } catch (error: unknown) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("Unknown error");
    }
  }
);

export const fetchCategoriesThunk = createAsyncThunk(
  "product/fetchCategories",
  async (_, { rejectWithValue }) => {
    try {
      return await productApi.getProductCategories();
    } catch (error: unknown) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("Unknown error");
    }
  }
);
