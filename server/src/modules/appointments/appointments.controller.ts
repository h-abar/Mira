import { type NextFunction, type Request, type Response } from 'express';
import { appointmentsService } from './appointments.service';
import {
  appointmentCreateSchema,
  appointmentGroupCreateSchema,
  appointmentIdSchema,
  appointmentUpdateSchema,
  listQuerySchema,
  statusSchema,
} from './appointments.validation';
import type { Lang } from '../notifications/notifications.service';

export const appointmentsController = {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = listQuerySchema.parse(req.query);
      const data = await appointmentsService.list(query);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = appointmentIdSchema.parse(req.params.id);
      const data = await appointmentsService.getById(id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = appointmentCreateSchema.parse(req.body);
      const data = await appointmentsService.create(body);
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async createGroup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = appointmentGroupCreateSchema.parse(req.body);
      const data = await appointmentsService.createGroup(body);
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = appointmentIdSchema.parse(req.params.id);
      const body = appointmentUpdateSchema.parse(req.body);
      const data = await appointmentsService.update(id, body);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async changeStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = appointmentIdSchema.parse(req.params.id);
      const { status, cancellationFee } = statusSchema.parse(req.body);
      const data = await appointmentsService.changeStatus(id, status, cancellationFee);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = appointmentIdSchema.parse(req.params.id);
      const data = await appointmentsService.remove(id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async remind(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = appointmentIdSchema.parse(req.params.id);
      const requestedLang = (req.body as { lang?: unknown } | undefined)?.lang;
      const lang: Lang =
        typeof requestedLang === 'string' && requestedLang === 'en' ? 'en' : 'ar';
      const data = await appointmentsService.sendReminder(id, lang);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },
};