import { NextFunction, Request, Response } from 'express';
import { settingsService } from './settings.service';
import { updateSettingsSchema } from './settings.validation';

export const settingsController = {
  async getSettings(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await settingsService.getAll();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async updateSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = updateSettingsSchema.parse(req.body);
      const data = await settingsService.update(parsed.values);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },
};
