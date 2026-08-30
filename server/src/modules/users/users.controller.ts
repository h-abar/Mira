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
      // Only ADMIN can create ADMIN users or assign the 'users' permission
      const requesterRole = req.user?.role;
      if (parsed.role === 'ADMIN' && requesterRole !== 'ADMIN') {
        throw new ApiError(403, 'Only administrators can create admin users.');
      }
      if (parsed.permissions?.includes('users') && requesterRole !== 'ADMIN') {
        throw new ApiError(403, 'Only administrators can grant user management permission.');
      }
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
      const requesterRole = req.user?.role;
      const requesterId = req.user?.id;
      // Only ADMIN can assign ADMIN role
      if (parsed.role === 'ADMIN' && requesterRole !== 'ADMIN') {
        throw new ApiError(403, 'Only administrators can assign the admin role.');
      }
      // Only ADMIN can grant 'users' permission
      if (parsed.permissions?.includes('users') && requesterRole !== 'ADMIN') {
        throw new ApiError(403, 'Only administrators can grant user management permission.');
      }
      // Prevent self-role change (escalation or demotion)
      if (parsed.role !== undefined && requesterId === id && parsed.role !== requesterRole) {
        throw new ApiError(403, 'You cannot change your own role.');
      }
      const user = await usersService.update(id, parsed, requesterId);
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