import { createAsyncThunk } from "@reduxjs/toolkit";
import { productService } from "../product.service";
import { Product } from "../../products/store/product.types";

export const fetchProductsThunk = createAsyncThunk(
  "product/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      return await productService.getAllProducts();
    } catch (error: unknown) {
      if (error instanceof Error) return rejectWithValue(error.message);
      return rejectWithValue("Unknown error");
    }
  }
);

export const fetchProductByIdThunk = createAsyncThunk<Product, number>(
  "product/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      return await productService.getProductById(id);
    } catch (error: unknown) {
      if (error instanceof Error) return rejectWithValue(error.message);
      return rejectWithValue("Unknown error");
    }
  }
);

export const createProductThunk = createAsyncThunk(
  "product/create",
  async (formData: FormData, { rejectWithValue }) => {
    try {
      return await productService.createProduct(formData);
    } catch (error: unknown) {
      if (error instanceof Error) return rejectWithValue(error.message);
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
      return await productService.updateProduct(id, formData);
    } catch (error: unknown) {
      if (error instanceof Error) return rejectWithValue(error.message);
      return rejectWithValue("Unknown error");
    }
  }
);

export const deleteProductThunk = createAsyncThunk<number, number>(
  "product/delete",
  async (id, { rejectWithValue }) => {
    try {
      await productService.deleteProduct(id);
      return id;
    } catch (error: unknown) {
      if (error instanceof Error) return rejectWithValue(error.message);
      return rejectWithValue("Unknown error");
    }
  }
);

export const fetchCategoriesThunk = createAsyncThunk(
  "product/fetchCategories",
  async (_, { rejectWithValue }) => {
    try {
      return await productService.getCategories();
    } catch (error: unknown) {
      if (error instanceof Error) return rejectWithValue(error.message);
      return rejectWithValue("Unknown error");
    }
  }
);
