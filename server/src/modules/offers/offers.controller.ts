import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../../utils/ApiError';
import { offersService } from './offers.service';
import {
  offerCreateSchema,
  offerListQuerySchema,
  offerUpdateSchema,
  offerValidateSchema,
} from './offers.validation';

function parseId(value: string): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ApiError(400, 'Invalid id.');
  }
  return id;
}

export const offersController = {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = offerListQuerySchema.parse(req.query);
      const data = await offersService.list(query.active);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = offerCreateSchema.parse(req.body);
      const data = await offersService.create(parsed);
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = offerUpdateSchema.parse(req.body);
      const data = await offersService.update(parseId(req.params.id), parsed);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await offersService.remove(parseId(req.params.id));
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async validate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = offerValidateSchema.parse(req.body);
      const data = await offersService.validateOffer(parsed.code, parsed.subtotal);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },
};