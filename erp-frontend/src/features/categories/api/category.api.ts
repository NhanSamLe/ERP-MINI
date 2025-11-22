import axiosClient from "../../../api/axiosClient";
import {
  ProductCategory,
  CategoryCreate,
  CategoryUpdate,
} from "../../categories/store/category.types";

export const categoryApi = {
  getAllCategories: async (): Promise<ProductCategory[]> => {
    const res = await axiosClient.get("/product-category");
    return res.data;
  },

  getCategoryById: async (id: number): Promise<ProductCategory> => {
    const res = await axiosClient.get(`/product-category/${id}`);
    return res.data;
  },

  createCategory: async (body: CategoryCreate): Promise<ProductCategory> => {
    const res = await axiosClient.post("/product-category", body);
    return res.data;
  },

  updateCategory: async (
    id: number,
    body: CategoryUpdate
  ): Promise<ProductCategory> => {
    return axiosClient
      .put(`/product-category/${id}`, body)
      .then((res) => res.data);
  },

  deleteCategory: async (id: number): Promise<void> => {
    await axiosClient.delete(`/product-category/${id}`);
  },
};
