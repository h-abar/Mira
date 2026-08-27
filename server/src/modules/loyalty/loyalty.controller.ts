import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../../utils/ApiError';
import { loyaltyService } from './loyalty.service';
import { adjustPointsSchema, loyaltyListQuerySchema } from './loyalty.validation';

function parseId(value: string): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ApiError(400, 'Invalid id.');
  }
  return id;
}

export const loyaltyController = {
  async listTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const clientId = parseId(req.params.id);
      const query = loyaltyListQuerySchema.parse(req.query);
      const data = await loyaltyService.listClientTransactions(clientId, query.page, query.limit);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async adjust(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const clientId = parseId(req.params.id);
      const parsed = adjustPointsSchema.parse(req.body);
      const data = await loyaltyService.adjustClientPoints(clientId, parsed);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },
};