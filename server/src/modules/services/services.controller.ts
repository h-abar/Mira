import { NextFunction, Request, Response } from 'express';
import { servicesService, type ServiceListParams } from './services.service';

export const servicesController = {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await servicesService.list(req.query as unknown as ServiceListParams);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await servicesService.getById(Number(req.params.id));
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await servicesService.create(req.body);
      res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await servicesService.update(Number(req.params.id), req.body);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await servicesService.remove(Number(req.params.id));
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async listCategories(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await servicesService.listCategories();
      res.json({ success: true, data: categories });
    } catch (error) {
      next(error);
    }
  },

  async renameCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const from = String(req.body?.from ?? '').trim();
      const to = String(req.body?.to ?? '').trim();
      const data = await servicesService.renameCategory(from, to);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },
};