import { Product } from "../models/product.model";
import { ProductCategory } from "../models/productCategory.model";
import { ProductImage } from "../models/productImage.model";
import { uploadBufferToCloudinary } from "../../../core/utils/uploadCloudinary";

export const productService = {
  async getAll() {
    return await Product.findAll({
      include: [
        { model: ProductCategory, as: "category" },
        {
          model: ProductImage,
          as: "images",
          attributes: ["id", "image_url", "image_public_id"],
        },
      ],
      order: [["id", "DESC"]],
    });
  },

  async getById(id: number) {
    return await Product.findByPk(id, {
      include: [{ model: ProductCategory, as: "category" }],
    });
  },

  async create(
    data: any,
    files?: { [fieldname: string]: Express.Multer.File[] }
  ) {
    let thumbnailUrl: string | null = null;
    let thumbnailPublicId: string | null = null;

    if (files?.thumbnail?.[0]) {
      const result = await uploadBufferToCloudinary(
        files.thumbnail[0].buffer,
        "product_images/thumbnails"
      );
      console.log("Thumbnail upload result:", result);
      thumbnailUrl = result.url;
      thumbnailPublicId = result.public_id;
    }

    const product = await Product.create({
      ...data,
      image_url: thumbnailUrl,
      image_public_id: thumbnailPublicId,
    });

    if (files?.gallery?.length) {
      const uploadedImages = await Promise.all(
        files.gallery.map(async (file) => {
          const result = await uploadBufferToCloudinary(
            file.buffer,
            "product_images/gallery"
          );
          return {
            product_id: product.id,
            image_url: result.url,
            image_public_id: result.public_id,
          };
        })
      );

      await ProductImage.bulkCreate(uploadedImages);
    }

    const createdProduct = await Product.findByPk(product.id, {
      include: [
        { model: ProductCategory, as: "category" },
        {
          model: ProductImage,
          as: "images",
          attributes: ["id", "image_url", "image_public_id"],
        },
      ],
    });

    return createdProduct;
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
