import { Request, Response } from "express";
import { priceListService } from "../services/priceList.service";

export const getAll = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const priceLists = await priceListService.getAll(user);
    res.status(200).json({ success: true, data: priceLists });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const plId = parseInt(req.params.id || "0");
    const pl = await priceListService.getById(plId, user);
    res.status(200).json({ success: true, data: pl });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const pl = await priceListService.create(req.body, user);
    res.status(201).json({ success: true, data: pl });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const plId = parseInt(req.params.id || "0");
    const pl = await priceListService.update(plId, req.body, user);
    res.status(200).json({ success: true, data: pl });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const plId = parseInt(req.params.id || "0");
    await priceListService.delete(plId, user);
    res.status(200).json({ success: true, message: "Price list deleted" });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
};

export const addItems = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const plId = parseInt(req.params.id || "0");
    const items = await priceListService.addItemsToPriceList(plId, req.body.items || [], user);
    res.status(201).json({ success: true, data: items });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
};

export const updateItem = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const itemId = parseInt(req.params.itemId || "0");
    const item = await priceListService.updateItem(itemId, req.body, user);
    res.status(200).json({ success: true, data: item });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
};

export const removeItem = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const itemId = parseInt(req.params.itemId || "0");
    await priceListService.removeItem(itemId, user);
    res.status(200).json({ success: true, message: "Item removed" });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
};

export const getProductPriceForOrder = async (req: Request, res: Response) => {
  try {
    const productId = parseInt(req.query.productId as string || "0");
    const priceListId = req.query.priceListId ? parseInt(req.query.priceListId as string) : undefined;
    const quantity = parseFloat(req.query.quantity as string || "1");
    
    if (!productId) throw new Error("productId is required");
    
    const price = await priceListService.getProductPrice(productId, priceListId, quantity);
    res.status(200).json({ success: true, data: price });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
};
