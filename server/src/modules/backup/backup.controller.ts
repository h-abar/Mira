import { NextFunction, Request, Response } from 'express';
import { backupService } from './backup.service';
import { backupStamp } from './backup.validation';
import { getBackupScheduleStatus, triggerBackupNow } from './scheduler';

export const backupController = {
  async exportJson(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await backupService.exportJson();
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="saloon-backup-${backupStamp()}.json"`,
      );
      res.json(data);
    } catch (err) {
      next(err);
    }
  },

  async exportSql(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.setHeader('Content-Type', 'application/sql');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="saloon-backup-${backupStamp()}.sql"`,
      );
      await backupService.exportSql(res);
    } catch (err) {
      next(err);
    }
  },

  async exportCsv(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const text = await backupService.exportCsv();
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="saloon-backup-${backupStamp()}.csv"`,
      );
      res.send(text);
    } catch (err) {
      next(err);
    }
  },

  async getScheduleStatus(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = getBackupScheduleStatus();
      res.json({ success: true, ...status });
    } catch (err) {
      next(err);
    }
  },

  async triggerNow(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await triggerBackupNow();
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },
};

