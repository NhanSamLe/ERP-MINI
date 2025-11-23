import { createSlice } from "@reduxjs/toolkit";
import { ProductCategory, ProductState } from "./product.types";
import {
  fetchProductsThunk,
  fetchProductByIdThunk,
  createProductThunk,
  updateProductThunk,
  deleteProductThunk,
  fetchCategoriesThunk,
} from "./product.thunks";

const initialState: ProductState = {
  items: [],
  categories: [] as ProductCategory[],
  selectedProduct: undefined,
  loading: false,
  error: null,
};

export const productSlice = createSlice({
  name: "product",
  initialState,
  reducers: {
    clearSelectedProduct(state) {
      state.selectedProduct = undefined;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProductsThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProductsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchProductsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(fetchProductByIdThunk.fulfilled, (state, action) => {
        state.selectedProduct = action.payload;
      })

      .addCase(createProductThunk.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })

      .addCase(updateProductThunk.fulfilled, (state, action) => {
        state.items = state.items.map((item) =>
          item.id === action.payload.id ? action.payload : item
        );
      })

      .addCase(deleteProductThunk.fulfilled, (state, action) => {
        state.items = state.items.filter((item) => item.id !== action.payload);
      })

      .addCase(fetchCategoriesThunk.fulfilled, (state, action) => {
        state.categories = action.payload;
      });
  },
});

export const { clearSelectedProduct } = productSlice.actions;
export default productSlice.reducer;
