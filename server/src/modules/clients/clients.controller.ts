import { NextFunction, Request, Response } from 'express';
import { clientsService, type ClientListParams } from './clients.service';

export const clientsController = {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await clientsService.list(req.query as unknown as ClientListParams);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await clientsService.getById(Number(req.params.id));
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await clientsService.create(req.body);
      res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await clientsService.update(Number(req.params.id), req.body);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await clientsService.remove(Number(req.params.id));
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },
};