import { type NextFunction, type Request, type Response } from 'express';
import { exportDataset, fmtDate, type ExportLang } from '../../utils/exportHelper';
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

  async exportAppointments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as unknown as {
        date?: string;
        employeeId?: number;
        status?: string;
        from?: string;
        to?: string;
        format?: string;
        lang?: string;
      };
      const lang: ExportLang = query.lang === 'en' ? 'en' : 'ar';
      const format = query.format === 'pdf' ? 'pdf' : 'excel';
      const items = await appointmentsService.list({
        date: query.date,
        employeeId: query.employeeId,
        status: query.status as any,
        from: query.from,
        to: query.to,
      });
      const isAr = lang === 'ar';
      const dataset = {
        title: isAr ? 'المواعيد' : 'Appointments',
        subtitle: isAr ? `إجمالي: ${items.length} موعد` : `Total: ${items.length} appointments`,
        lang,
        columns: isAr
          ? ['#', 'التاريخ', 'الوقت', 'العميل', 'الموظف', 'الخدمة', 'الحالة', 'المدة (دقيقة)']
          : ['#', 'Date', 'Time', 'Client', 'Employee', 'Service', 'Status', 'Duration (min)'],
        rows: items.map((appt: any) => [
          appt.id,
          fmtDate(appt.date),
          appt.startTime ?? '—',
          appt.client?.name ?? '—',
          isAr ? (appt.employee?.nameAr ?? '—') : (appt.employee?.nameEn ?? '—'),
          isAr ? (appt.service?.nameAr ?? '—') : (appt.service?.nameEn ?? '—'),
          appt.status ?? '—',
          Number(appt.service?.durationMinutes ?? 0),
        ]),
      };
      const result = await exportDataset(dataset, format);
      res.setHeader('Content-Type', result.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="appointments.${result.extension}"`);
      res.send(result.buffer);
    } catch (err) {
      next(err);
    }
  },
};