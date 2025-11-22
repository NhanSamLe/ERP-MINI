import { createSlice } from "@reduxjs/toolkit";
import { ProductCategory, ProductCategoryState } from "./category.types";
import {
  fetchCategoriesThunk,
  fetchCategoryByIdThunk,
  createCategoryThunk,
  updateCategoryThunk,
  deleteCategoryThunk,
} from "./category.thunks";

const initialState: ProductCategoryState = {
  items: [],
  categories_child: [] as ProductCategory[],
  selectedCategory: undefined,
  loading: false,
  error: null,
};

export const categorySlice = createSlice({
  name: "category",
  initialState,
  reducers: {
    clearSelectedCategory(state) {
      state.selectedCategory = undefined;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategoriesThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCategoriesThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchCategoriesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(fetchCategoryByIdThunk.fulfilled, (state, action) => {
        state.selectedCategory = action.payload;
      })

      .addCase(createCategoryThunk.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })

      .addCase(updateCategoryThunk.fulfilled, (state, action) => {
        state.items = state.items.map((item) =>
          item.id === action.payload.id ? action.payload : item
        );
      })

      .addCase(deleteCategoryThunk.fulfilled, (state, action) => {
        state.items = state.items.filter((item) => item.id !== action.payload);
      });
  },
});

export const { clearSelectedCategory } = categorySlice.actions;
export default categorySlice.reducer;
