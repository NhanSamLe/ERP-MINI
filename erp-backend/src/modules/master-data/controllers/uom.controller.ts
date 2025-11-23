import { Request, Response } from "express";
import * as uomService from "../services/uom.service";

export const searchUoms = async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    const result = await uomService.searchUoms(search as string);

    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ message: "Không thể tải danh sách đơn vị tính. Vui lòng thử lại sau." });
  }
};
export const getAllUoms = async (req: Request, res: Response) => {
  try {
    const result = await uomService.getAllUoms();   
    res.status(200).json(result);
    } catch (error: any) {  
    res.status(500).json({ message: "Không thể tải danh sách đơn vị tính. Vui lòng thử lại sau." });
    }   
};
export const getUomById = async (req: Request, res: Response) => {
  try {
    const data = await uomService.getUomById(Number(req.params.id));
    res.status(200).json(data);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

export const createUom = async (req: Request, res: Response) => {
  try {
    const dto: uomService.CreateUomDto = req.body;
    const result = await uomService.createUom(dto);

    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateUom = async (req: Request, res: Response) => {
  try {
    const dto: uomService.UpdateUomDto = req.body;
    const result = await uomService.updateUom(Number(req.params.id), dto);

    res.status(200).json(result);
  } catch (error: any) {
    if (error.message.includes("không tồn tại"))
      return res.status(404).json({ message: error.message });

    res.status(400).json({ message: error.message });
  }
};

export const deleteUom = async (req: Request, res: Response) => {
  try {
    const result = await uomService.deleteUom(Number(req.params.id));
    res.status(200).json(result);
  } catch (error: any) {
    if (error.message.includes("không tồn tại"))
      return res.status(404).json({ message: error.message });

    res.status(400).json({ message: error.message });
  }
};
