import { Request, Response } from 'express';
import { registerCompany } from '../services/register.service';

export async function register(req: Request, res: Response) {
  try {
    const result = await registerCompany(req.body);
    return res.status(201).json(result);
  } catch (err: any) {
    const isDuplicate = err.message?.includes('đã được đăng ký') || err.message?.includes('đã được sử dụng');
    return res.status(isDuplicate ? 409 : 400).json({ message: err.message || 'Đăng ký thất bại' });
  }
}
