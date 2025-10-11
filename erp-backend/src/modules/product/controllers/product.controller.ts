import { Request, Response } from "express";
import { productService } from "../services/product.service";

export const productController = {
  async getAllProduct(req: Request, res: Response) {
    try {
      const data = await productService.getAll();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },

  async getProductById(req: Request, res: Response) {
    try {
      if (!req.params.id) {
        return res.status(400).json({ message: "Missing id parameter" });
      }
      const id = parseInt(req.params.id);
      const data = await productService.getById(id);
      if (!data) return res.status(404).json({ message: "Product not found" });
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },

  async createProduct(req: Request, res: Response) {
    try {
      const newProduct = await productService.create(req.body);
      res.status(201).json(newProduct);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  },

  async updateProduct(req: Request, res: Response) {
    try {
      if (!req.params.id) {
        return res.status(400).json({ message: "Missing id parameter" });
      }
      const id = parseInt(req.params.id);
      const update = await productService.update(id, req.body);
      res.json(update);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  },

  async deleteProduct(req: Request, res: Response) {
    try {
      if (!req.params.id) {
        return res.status(400).json({ message: "Missing id parameter" });
      }
      const id = parseInt(req.params.id);
      const result = await productService.delete(id);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  },
};
