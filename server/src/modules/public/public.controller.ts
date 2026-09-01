import { type NextFunction, type Request, type Response } from 'express';
import { z } from 'zod';
import { publicService } from './public.service';

const getAvailableSlotsSchema = z.object({
  date: z.string().min(1),
  serviceId: z.union([z.coerce.number(), z.array(z.coerce.number()), z.string()]).optional(),
  serviceIds: z.union([z.array(z.coerce.number()), z.string()]).optional(),
  employeeId: z.coerce.number().optional(),
});

const createBookingItemSchema = z.object({
  serviceId: z.coerce.number().positive(),
  employeeId: z.coerce.number().optional(),
});

const createBookingSchema = z.object({
  name: z.string().min(2, 'يرجى إدخال الاسم بشكل صحيح'),
  phone: z.string().min(8, 'يرجى إدخال رقم هاتف صحيح'),
  serviceId: z.coerce.number().optional(),
  items: z.array(createBookingItemSchema).optional(),
  employeeId: z.coerce.number().optional(),
  date: z.string().min(1),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'تنسيق الوقت غير صحيح'),
  notes: z.string().optional(),
});

export const publicController = {
  async getServices(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await publicService.getServices();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async getEmployees(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await publicService.getEmployees();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async getInfo(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await publicService.getSalonInfo();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async getAvailableSlots(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = getAvailableSlotsSchema.parse(req.query);
      const date = parsed.date;
      const employeeId = parsed.employeeId;
      let serviceIds: number[];
      if (parsed.serviceIds) {
        serviceIds = (Array.isArray(parsed.serviceIds) ? parsed.serviceIds : String(parsed.serviceIds).split(',')).map(Number).filter(Boolean);
      } else if (parsed.serviceId) {
        serviceIds = (Array.isArray(parsed.serviceId) ? parsed.serviceId : String(parsed.serviceId).split(',')).map(Number).filter(Boolean);
      } else {
        serviceIds = [];
      }
      const data = await publicService.getAvailableSlots(date, serviceIds, employeeId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async createBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = createBookingSchema.parse(req.body);
      const data = await publicService.createBooking(body);
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async searchBookings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = z
        .object({
          code: z.string().optional(),
          phone: z.string().optional(),
          name: z.string().optional(),
        })
        .parse(req.query);
      const data = await publicService.searchBookings(parsed);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async getBookingByCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const code = String(req.params.code);
      const data = await publicService.getBookingByCode(code);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },
};
