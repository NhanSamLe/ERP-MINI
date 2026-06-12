import { Request, Response } from 'express';
import { ValidationError, UniqueConstraintError } from 'sequelize';
import { registerCompany } from '../services/register.service';

export async function register(req: Request, res: Response) {
  try {
    const result = await registerCompany(req.body);
    return res.status(201).json(result);
  } catch (err: any) {
    let message = err.message || 'Đăng ký thất bại';

    if ((err instanceof ValidationError || err instanceof UniqueConstraintError) && err.errors?.length > 0) {
      message = err.errors.map((item: any) => item.message).join('; ');
    }

    const normalizedMessage = message.toLowerCase();
    const isDuplicate =
      err instanceof UniqueConstraintError ||
      normalizedMessage.includes('must be unique') ||
      normalizedMessage.includes('đã được đăng ký') ||
      normalizedMessage.includes('đã được sử dụng') ||
      normalizedMessage.includes('đã tồn tại');

    return res.status(isDuplicate ? 409 : 400).json({ message });
  }
}
