import { type NextFunction, type Request, type Response } from 'express';
import { notificationsService, type Lang } from './notifications.service';
import { getReminderScheduleStatus } from './reminder-scheduler';
import {
  campaignSchema,
  listNotificationsSchema,
  retryNotificationSchema,
  sendWhatsAppSchema,
  testWhatsAppSchema,
} from './notifications.validation';

export const notificationsController = {
  async sendWhatsApp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = sendWhatsAppSchema.parse(req.body);
      const lang: Lang = req.lang === 'en' ? 'en' : 'ar';
      const data = await notificationsService.sendWhatsApp(body.phone, body.message, {
        referenceId: body.referenceId,
        type: body.type,
        lang,
      });
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async testWhatsApp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = testWhatsAppSchema.parse(req.body);
      const data = await notificationsService.sendWhatsApp(body.phone, 'Test message from Mira', {
        type: 'test',
      });
      res.json({ success: true, simulated: Boolean(data.simulated) });
    } catch (err) {
      next(err);
    }
  },

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = listNotificationsSchema.parse(req.query);
      const data = await notificationsService.list(query);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async sendCampaign(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = campaignSchema.parse(req.body);
      const lang: Lang = req.lang === 'en' ? 'en' : 'ar';
      const data = await notificationsService.sendCampaign({ ...body, lang });
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async retry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = retryNotificationSchema.parse(req.params);
      const data = await notificationsService.retry(id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async schedule(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.json({ success: true, data: getReminderScheduleStatus() });
    } catch (err) {
      next(err);
    }
  },
};