import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../../utils/ApiError';
import { usersService } from './users.service';
import { userCreateSchema, userUpdateSchema } from './users.validation';

export const usersController = {
  async list(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await usersService.list();
      res.json({ success: true, data: users });
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = userCreateSchema.parse(req.body);
      const user = await usersService.create(parsed);
      res.status(201).json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (!id || Number.isNaN(id)) {
        throw new ApiError(400, 'Invalid user ID');
      }
      const parsed = userUpdateSchema.parse(req.body);
      const user = await usersService.update(id, parsed, req.user?.id);
      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  },

  async getPermissionDefs(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.json({ success: true, data: usersService.getPermissionDefs() });
    } catch (err) {
      next(err);
    }
  },
};