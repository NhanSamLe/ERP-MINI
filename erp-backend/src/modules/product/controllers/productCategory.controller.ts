import { Request, Response } from "express";
import { productCategoryService } from "../services/productCategory.service";

export const productCategoryController = {
  async getCategoryAll(req: Request, res: Response) {
    try {
      const data = await productCategoryService.getAll();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },

  async getCategoryById(req: Request, res: Response) {
    try {
      if (!req.params.id) {
        return res.status(400).json({ message: "Missing id parameter" });
      }
      const id = parseInt(req.params.id);
      const data = await productCategoryService.getById(id);
      if (!data) return res.status(404).json({ message: "Category not found" });
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },

  async createCategory(req: Request, res: Response) {
    try {
      const newCategory = await productCategoryService.create(req.body);
      res.status(201).json(newCategory);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  },

  async updateCategory(req: Request, res: Response) {
    try {
      if (!req.params.id) {
        return res.status(400).json({ message: "Missing id parameter" });
      }
      const id = parseInt(req.params.id);
      const updateCategory = await productCategoryService.update(id, req.body);
      res.json(updateCategory);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  },

  async deleteCategory(req: Request, res: Response) {
    try {
      if (!req.params.id) {
        return res.status(400).json({ message: "Missing id parameter" });
      }
      const id = parseInt(req.params.id);
      const result = await productCategoryService.delete(id);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  },
};
