import { Request, Response } from "express";
import { productService } from "../services/product.service";

export const productController = {
  async getAllProductOnActive(req: Request, res: Response) {
    try {
      const data = await productService.getAllOnActive();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },

  async getAllProductAllStatus(req: Request, res: Response) {
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
      console.log("🟢 req.body:", req.body);
      console.log("🟣 req.files:", req.files);
      const files = req.files as
        | { [fieldname: string]: Express.Multer.File[] }
        | undefined;

      const newProduct = await productService.create(req.body, files);
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
      const files = req.files as
        | { [fieldname: string]: Express.Multer.File[] }
        | undefined;

      console.log("🟡 Updating product ID:", id);
      console.log("🟢 req.body:", req.body);
      console.log("🟣 req.files:", req.files);

      const updated = await productService.update(id, req.body, files);
      res.json(updated);
    } catch (err: any) {
      console.error("❌ Error updating product:", err);
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

  async searchProducts(req: Request, res: Response) {
    try {
      const keyword = req.query.q?.toString().toLowerCase();

      if (!keyword || keyword.length < 2) {
        return res.status(400).json({
          message: "Keyword must be at least 2 characters",
        });
      }

      const results = await productService.search(keyword);
      res.json(results);
    } catch (err) {
      console.error("SearchProduct error:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
};
