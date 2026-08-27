import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../../utils/ApiError';
import { attendanceService } from './attendance.service';
import {
  attendanceSummarySchema,
  checkInSchema,
  checkOutSchema,
  listAttendanceSchema,
} from './attendance.validation';

function resolveEmployeeId(req: Request, bodyEmployeeId?: number): number {
  if (bodyEmployeeId !== undefined) {
    return bodyEmployeeId;
  }
  if (req.user?.employeeId) {
    return req.user.employeeId;
  }
  throw new ApiError(400, 'يرجى تحديد الموظفة');
}

export const attendanceController = {
  async checkIn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = checkInSchema.parse(req.body);
      const employeeId = resolveEmployeeId(req, parsed.employeeId);
      const result = await attendanceService.checkIn(employeeId);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async checkOut(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = checkOutSchema.parse(req.body);
      const employeeId = resolveEmployeeId(req, parsed.employeeId);
      const record = await attendanceService.checkOut(employeeId);
      res.json({ success: true, data: record });
    } catch (err) {
      next(err);
    }
  },

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = listAttendanceSchema.parse(req.query);
      const from = query.from ? new Date(query.from) : undefined;
      const to = query.to ? new Date(query.to) : undefined;

      const data = await attendanceService.list({
        from,
        to,
        employeeId: query.employeeId,
        page: query.page,
        limit: query.limit,
      });

      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async summary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = attendanceSummarySchema.parse(req.query);
      const from = query.from ? new Date(query.from) : undefined;
      const to = query.to ? new Date(query.to) : undefined;

      const data = await attendanceService.summary({
        from,
        to,
        employeeId: query.employeeId,
      });

      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },
};