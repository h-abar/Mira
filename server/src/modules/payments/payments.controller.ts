import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../../utils/ApiError';
import { paymentsService, type PaymentCreateInput, type PaymentListQuery } from './payments.service';

async function createPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await paymentsService.createPayment(req.body as PaymentCreateInput);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function listPayments(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = (res.locals.paymentQuery ?? {}) as PaymentListQuery;
    const data = await paymentsService.listPayments(query);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function refundPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      throw new ApiError(400, 'Invalid payment ID');
    }
    const data = await paymentsService.refundPayment(id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export const paymentsController = {
  createPayment,
  listPayments,
  refundPayment,
};