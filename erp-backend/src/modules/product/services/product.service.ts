import { Product } from "../models/product.model";
import { ProductCategory } from "../models/productCategory.model";
import { ProductImage } from "../models/productImage.model";
import {
  uploadBufferToCloudinary,
  deleteFromCloudinary,
} from "../../../core/utils/uploadCloudinary";
import { hasLinkedData } from "../../../core/utils/getRelation";
import { Op } from "sequelize";

export const productService = {
  async getAllOnActive() {
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

  async update(
    id: number,
    data: any,
    files?: { [fieldname: string]: Express.Multer.File[] }
  ) {
    const product = await Product.findByPk(id);
    if (!product) throw new Error("Product not found");

    if (files?.thumbnail?.[0]) {
      const result = await uploadBufferToCloudinary(
        files.thumbnail[0].buffer,
        "product_images/thumbnails"
      );

      if (product.image_public_id) {
        try {
          await deleteFromCloudinary(product.image_public_id);
        } catch (e) {
          console.warn("Không thể xóa thumbnail cũ:", e);
        }
      }

      data.image_url = result.url;
      data.image_public_id = result.public_id;
    }

    await product.update(data);

    if (data.deleteImageIds) {
      try {
        const idsToDelete = JSON.parse(data.deleteImageIds);
        if (Array.isArray(idsToDelete) && idsToDelete.length > 0) {
          const images = await ProductImage.findAll({
            where: { id: idsToDelete },
          });

          for (const img of images) {
            try {
              await deleteFromCloudinary(img.image_public_id);
              await img.destroy();
            } catch (err) {
              console.warn(`Không thể xóa ảnh ${img.image_public_id}:`, err);
            }
          }
        }
      } catch (err) {
        console.error("Lỗi parse deleteImageIds:", err);
      }
    }

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

    const updatedProduct = await Product.findByPk(product.id, {
      include: [
        { model: ProductCategory, as: "category" },
        {
          model: ProductImage,
          as: "images",
          attributes: ["id", "image_url", "image_public_id"],
        },
      ],
    });

    return updatedProduct;
  },

  async delete(id: number) {
    const product = await Product.findByPk(id, {
      include: [{ model: ProductImage, as: "images" }],
    });

    if (!product) throw new Error("Product not found");

    const linked = await hasLinkedData(Product, id);

    if (linked) {
      product.status = "inactive";
      await product.save();
      return {
        message:
          "Product được vô hiệu hóa (đã liên kết dữ liệu, không thể xóa)",
      };
    }

    if (product.image_public_id) {
      try {
        await deleteFromCloudinary(product.image_public_id);
      } catch (e) {
        console.warn("Không thể xóa thumbnail:", e);
      }
    }

    if (product.images && product.images.length > 0) {
      for (const img of product.images) {
        try {
          await deleteFromCloudinary(img.image_public_id);
        } catch (e) {
          console.warn("Không thể xóa ảnh gallery:", e);
        }
      }
    }

    await product.destroy();
    return { message: "Product và ảnh đã được xóa thành công" };
  },

  async search(keyword: string) {
    return await Product.findAll({
      where: {
        name: {
          [Op.like]: `%${keyword}%`,
        },
      },
      include: [
        { model: ProductCategory, as: "category" },
        {
          model: ProductImage,
          as: "images",
          attributes: ["id", "image_url", "image_public_id"],
        },
      ],
      limit: 20,
      order: [["name", "ASC"]],
    });
  },
};
