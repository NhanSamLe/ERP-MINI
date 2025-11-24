import { productApi } from "./api/product.api";
import { Product } from "../products/store/product.types";

export const productService = {
  async getAllProductsOnActive(): Promise<Product[]> {
    return await productApi.getAllProductsOnActive();
  },

  async getProductById(id: number): Promise<Product> {
    return await productApi.getProductById(id);
  },

  async createProduct(formData: FormData): Promise<Product> {
    return await productApi.createProduct(formData);
  },

  async updateProduct(id: number, formData: FormData): Promise<Product> {
    return await productApi.updateProduct(id, formData);
  },

  async deleteProduct(id: number): Promise<void> {
    await productApi.deleteProduct(id);
  },

  async getCategories() {
    return await productApi.getProductCategories();
  },

  searchProducts: async (keyword: string) => {
    const res = await productApi.search(keyword);
    return res.data.map((p: Product) => ({
      ...p,
      cost_price: Number(p.cost_price),
      sale_price: Number(p.sale_price),
    }));
  },
};
