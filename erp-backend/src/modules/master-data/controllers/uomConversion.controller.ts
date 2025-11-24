import { Request, Response } from "express";
import * as conversionService from "../services/uomConversion.service";


export const searchConversions = async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    const result = await conversionService.searchConversions(search as string);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({
      message: "Không thể tải danh sách quy đổi đơn vị tính. Vui lòng thử lại sau.",
    });
  }
};
export const getAllConversions = async (req: Request, res: Response) => {
    try {
        const result = await conversionService.getAllConversions();
        res.status(200).json(result);
    } catch (error: any) {
        res.status(500).json({
            message: "Không thể tải danh sách quy đổi đơn vị tính. Vui lòng thử lại sau.",
        });
    }
};
export const createConversion = async (req: Request, res: Response) => {
  try {
    const dto: conversionService.CreateUomConversionDto = req.body;
    const result = await conversionService.createConversion(dto);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateConversion = async (req: Request, res: Response) => {
  try {
    const dto: conversionService.UpdateUomConversionDto = req.body;
    const result = await conversionService.updateConversion(Number(req.params.id), dto);
    res.status(200).json(result);
  } catch (error: any) {
    if (error.message.includes("không tồn tại"))
      return res.status(404).json({ message: error.message });

    res.status(400).json({ message: error.message });
  }
};

export const deleteConversion = async (req: Request, res: Response) => {
  try {
    const result = await conversionService.deleteConversion(Number(req.params.id));
    res.status(200).json(result);
  } catch (error: any) {
    if (error.message.includes("không tồn tại"))
      return res.status(404).json({ message: error.message });

    res.status(400).json({ message: error.message });
  }
};
