import axiosClient from "../../../api/axiosClient";
import { Product, ProductCategory } from "../../products/store/product.types";

export const productApi = {
  getAllProductsOnActive: async (): Promise<Product[]> => {
    const res = await axiosClient.get("/product");
    return res.data;
  },

  getProductById: async (id: number): Promise<Product> => {
    const res = await axiosClient.get(`/product/${id}`);
    return res.data;
  },

  createProduct: async (formData: FormData): Promise<Product> => {
    const res = await axiosClient.post("/product", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  },

  updateProduct: async (id: number, data: FormData): Promise<Product> => {
    return axiosClient.put(`/product/${id}`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  deleteProduct: async (id: number): Promise<void> => {
    await axiosClient.delete(`/product/${id}`);
  },

  getProductCategories: async (): Promise<ProductCategory[]> => {
    const res = await axiosClient.get("/product-category");
    return res.data;
  },
};
