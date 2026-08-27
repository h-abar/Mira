import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { ApiError } from '../../utils/ApiError';
import { shiftsService } from './shifts.service';

const openShiftSchema = z.object({
  employeeId: z.coerce.number().positive('يرجى تحديد الموظفة'),
  openingBalance: z.coerce.number().min(0, 'الرصيد الافتتاحي لا يمكن أن يكون سالباً').optional().default(0),
  notes: z.string().optional(),
});

const closeShiftSchema = z.object({
  actualCash: z.coerce.number().min(0, 'المبلغ النقدي الفعلي لا يمكن أن يكون سالباً'),
  notes: z.string().optional(),
});

const listShiftsSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  employeeId: z.coerce.number().positive().optional(),
  status: z.enum(['OPEN', 'CLOSED']).optional(),
  branchId: z.coerce.number().positive().optional(),
  page: z.coerce.number().positive().optional().default(1),
  limit: z.coerce.number().positive().optional().default(20),
});

export const shiftsController = {
  async openShift(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = openShiftSchema.parse(req.body);
      const userId = req.user?.id;
      if (!userId) {
        throw new ApiError(401, 'Unauthorized');
      }

      const shift = await shiftsService.openShift({
        employeeId: parsed.employeeId,
        openedByUserId: userId,
        openingBalance: parsed.openingBalance,
        notes: parsed.notes,
      });

      res.status(201).json({ success: true, data: shift });
    } catch (err) {
      next(err);
    }
  },

  async getActiveShift(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const employeeId = req.query.employeeId ? Number(req.query.employeeId) : undefined;
      const data = await shiftsService.getActiveShift(employeeId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async closeShift(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (!id || Number.isNaN(id)) {
        throw new ApiError(400, 'Invalid shift ID');
      }

      const parsed = closeShiftSchema.parse(req.body);
      const shift = await shiftsService.closeShift(id, parsed);

      res.json({ success: true, data: shift });
    } catch (err) {
      next(err);
    }
  },

  async listShifts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = listShiftsSchema.parse(req.query);
      const from = query.from ? new Date(query.from) : undefined;
      const to = query.to ? new Date(query.to) : undefined;

      const data = await shiftsService.listShifts({
        from,
        to,
        employeeId: query.employeeId,
        status: query.status,
        branchId: query.branchId,
        page: query.page,
        limit: query.limit,
      });

      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async getShiftDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (!id || Number.isNaN(id)) {
        throw new ApiError(400, 'Invalid shift ID');
      }

      const shift = await shiftsService.getShiftDetails(id);
      res.json({ success: true, data: shift });
    } catch (err) {
      next(err);
    }
  },
};
