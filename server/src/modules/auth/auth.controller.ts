import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../../utils/ApiError';
import { authService } from './auth.service';

async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await authService.login(req.body.username, req.body.password);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function me(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Authentication required.');
    }
    const user = await authService.getMe(req.user.id);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

export const authController = { login, me };