import { Product } from "../models/product.model";
import { ProductCategory } from "../models/productCategory.model";

export const productService = {
  async getAll() {
    return await Product.findAll({
      include: [{ model: ProductCategory, as: "category" }],
      order: [["id", "DESC"]],
    });
  },

  async getById(id: number) {
    return await Product.findByPk(id, {
      include: [{ model: ProductCategory, as: "category" }],
    });
  },

  async create(data: any) {
    return await Product.create(data);
  },

  async update(id: number, data: any) {
    const product = await Product.findByPk(id);
    if (!product) throw new Error("Product not found");
    return await product.update(data);
  },

  async delete(id: number) {
    const product = await Product.findByPk(id);
    if (!product) throw new Error("Product not found");
    await product.destroy();
    return { message: "Product deleted successfully" };
  },
};
