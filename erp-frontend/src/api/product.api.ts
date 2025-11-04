import axiosClient from "./axiosClient";
import { Product } from "../types/product";

export const productApi = {
  getAllProducts: async (): Promise<Product[]> => {
    const res = await axiosClient.get("/product");
    return res.data;
  },

  getProductById: async (id: number): Promise<Product> => {
    const res = await axiosClient.get(`/product/${id}`);
    return res.data;
  },

  createProduct: async (data: Product): Promise<Product> => {
    const res = await axiosClient.post("/product", data);
    return res.data;
  },

  updateProduct: async (id: number, data: Product): Promise<Product> => {
    const res = await axiosClient.put(`/product/${id}`, data);
    return res.data;
  },

  deleteProduct: async (id: number): Promise<void> => {
    await axiosClient.delete(`/product/${id}`);
  },
};
