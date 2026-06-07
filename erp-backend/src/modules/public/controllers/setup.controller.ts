import { Request, Response } from 'express';
import * as setupService from '../services/setup.service';
import multer from 'multer';

function getUser(req: Request) {
  return (req as any).user as { company_id?: number; branch_id?: number } | undefined;
}

export async function getStatus(req: Request, res: Response) {
  try {
    const companyId = getUser(req)?.company_id;
    if (!companyId) return res.status(400).json({ message: 'Thiếu company_id' });
    const status = await setupService.getSetupStatus(companyId);
    return res.json(status);
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
}

export async function step1(req: Request, res: Response) {
  try {
    const companyId = getUser(req)?.company_id;
    if (!companyId) return res.status(400).json({ message: 'Thiếu company_id' });
    const result = await setupService.completeStep1(companyId, req.body);
    return res.json({ message: 'Đã lưu thông tin công ty', data: result });
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
}

export async function uploadLogo(req: Request, res: Response) {
  try {
    const companyId = getUser(req)?.company_id;
    if (!companyId) return res.status(400).json({ message: 'Thiếu company_id' });
    if (!req.file) return res.status(400).json({ message: 'Chưa chọn file logo' });
    const result = await setupService.updateCompanyLogo(companyId, req.file.buffer);
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
}

export async function step2(req: Request, res: Response) {
  try {
    const companyId = getUser(req)?.company_id;
    if (!companyId) return res.status(400).json({ message: 'Thiếu company_id' });
    const result = await setupService.completeStep2(companyId, req.body);
    return res.json({ message: 'Đã lưu cấu hình tài chính', data: result });
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
}

export async function step3(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user?.branch_id) return res.status(400).json({ message: 'Thiếu branch_id' });
    const result = await setupService.completeStep3(user.branch_id, req.body);
    return res.json({ message: 'Đã cấu hình kho', data: result });
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
}

export async function step4(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user?.branch_id) return res.status(400).json({ message: 'Thiếu branch_id' });
    const result = await setupService.completeStep4(user.branch_id, req.body);
    return res.json({ message: 'Đã cấu hình bộ phận', data: result });
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
}

export async function complete(req: Request, res: Response) {
  try {
    const companyId = getUser(req)?.company_id;
    if (!companyId) return res.status(400).json({ message: 'Thiếu company_id' });
    const result = await setupService.completeSetup(companyId);
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
}
