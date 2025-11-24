import { ProductCategory } from "../models/productCategory.model";
import { Product } from "../models/product.model";

export const productCategoryService = {
  async getAll() {
    return await ProductCategory.findAll({
      where: { status: true },
      include: [
        {
          model: ProductCategory,
          as: "children",
          where: { status: true },
          required: false,
        },
      ],
      order: [["id", "DESC"]],
    });
  },

  async getById(id: number) {
    return await ProductCategory.findByPk(id, {
      include: [{ model: ProductCategory, as: "children" }],
    });
  },

  async create(data: any) {
    return await ProductCategory.create(data);
  },

  async update(id: number, data: any) {
    const category = await ProductCategory.findByPk(id);
    if (!category) throw new Error("category not found");
    return await category.update(data);
  },

  async delete(id: number) {
    const category = await ProductCategory.findByPk(id);
    const hasProducts = await Product.count({
      where: { category_id: id },
    });
    if (!category) throw new Error("Category not found");

    if (hasProducts > 0) {
      category.status = false;
      await category.save();
      return { message: "Category deactivated successfully" };
    }
    await category.destroy();
    return { message: "Category deleted successfully" };
  },
};
