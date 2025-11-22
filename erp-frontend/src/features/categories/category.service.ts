// src/features/categories/store/category.service.ts
import { categoryApi } from "./api/category.api";
import {
  CategoryCreate,
  ProductCategory,
} from "../categories/store/category.types";

export const categoryService = {
  async getAll(): Promise<ProductCategory[]> {
    return await categoryApi.getAllCategories();
  },

  async getById(id: number): Promise<ProductCategory> {
    return await categoryApi.getCategoryById(id);
  },

  async create(body: CategoryCreate): Promise<ProductCategory> {
    return await categoryApi.createCategory(body);
  },

  async update(id: number, body: CategoryCreate): Promise<ProductCategory> {
    return await categoryApi.updateCategory(id, body);
  },

  async delete(id: number): Promise<void> {
    return await categoryApi.deleteCategory(id);
  },
};
