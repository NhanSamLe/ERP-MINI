import { Request, Response } from "express";
import { productImageService } from "../services/productImage.service";

export const productImageController = {
  async getProductImagesByProductId(req: Request, res: Response) {
    try {
      const { productId } = req.params;
      const images = await productImageService.getByProductId(
        Number(productId)
      );
      res.status(200).json(images);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  },

  async getProductImageById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const image = await productImageService.getById(Number(id));
      if (!image) {
        return res.status(404).json({ message: "Product image not found" });
      }
      res.status(200).json(image);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  },

  async createProductImage(req: Request, res: Response) {
    try {
      const { product_id, image_url, image_public_id } = req.body;
      const newImage = await productImageService.create({
        product_id,
        image_url,
        image_public_id,
      });
      res.status(201).json(newImage);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  },

  async updateProductImage(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = req.body;
      const updatedImage = await productImageService.update(Number(id), data);
      if (!updatedImage) {
        return res.status(404).json({ message: "Product image not found" });
      }
      res.status(200).json(updatedImage);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  },

  async deleteProductImage(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await productImageService.delete(Number(id));
      if (!result) {
        return res.status(404).json({ message: "Product image not found" });
      }
      res.status(200).json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  },
};
