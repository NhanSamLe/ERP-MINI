import { ProductImage } from "../models/productImage.model";

export class ProductImageService {
  async getByProductId(productId: number): Promise<ProductImage[]> {
    return await ProductImage.findAll({ where: { product_id: productId } });
  }

  async getById(id: number): Promise<ProductImage | null> {
    return await ProductImage.findByPk(id);
  }

  async create(data: {
    product_id: number;
    image_url: string;
    image_public_id: string;
  }): Promise<ProductImage> {
    return await ProductImage.create(data);
  }

  async update(
    id: number,
    data: Partial<ProductImage>
  ): Promise<ProductImage | null> {
    const productImage = await ProductImage.findByPk(id);
    if (!productImage) return null;
    return await productImage.update(data);
  }

  async delete(id: number) {
    const productImage = await ProductImage.findByPk(id);
    if (!productImage) return null;
    await productImage.destroy();
    return { message: "Product image deleted successfully" };
  }
}
export const productImageService = new ProductImageService();
