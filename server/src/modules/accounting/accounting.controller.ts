import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../../utils/ApiError';
import {
  accountingService,
  type AppointmentInvoiceInput,
  type ExpenseCreateInput,
  type ManualInvoiceInput,
} from './accounting.service';

function parseId(value: string): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ApiError(400, 'Invalid id.');
  }
  return id;
}

async function createInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as Partial<AppointmentInvoiceInput> & Partial<ManualInvoiceInput>;
    let data: unknown;
    if (body.appointmentId) {
      const input: AppointmentInvoiceInput = {
        appointmentId: body.appointmentId,
        discount: body.discount ?? 0,
        tax: body.tax ?? 0,
        paymentMethod: body.paymentMethod ?? 'CASH',
        offerCode: body.offerCode,
        redeemPoints: body.redeemPoints,
        branchId: body.branchId,
      };
      data = await accountingService.createInvoiceFromAppointment(input);
    } else {
      data = await accountingService.createInvoiceManual(body as ManualInvoiceInput);
    }
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function listInvoices(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = req.query as unknown as {
      from?: Date;
      to?: Date;
      page?: number;
      limit?: number;
      clientId?: number;
      branchId?: number;
    };
    const data = await accountingService.listInvoices({
      from: query.from,
      to: query.to,
      page: query.page,
      limit: query.limit,
      clientId: query.clientId,
      branchId: query.branchId,
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function getInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await accountingService.getInvoice(parseId(req.params.id));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function createExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Authentication required.');
    }
    const data = await accountingService.createExpense(
      req.body as ExpenseCreateInput,
      req.user.id,
    );
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function listExpenses(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = req.query as unknown as { from?: Date; to?: Date; category?: string };
    const data = await accountingService.listExpenses({
      from: query.from,
      to: query.to,
      category: query.category,
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function updateExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await accountingService.updateExpense(
      parseId(req.params.id),
      req.body as Partial<ExpenseCreateInput>,
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function removeExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await accountingService.removeExpense(parseId(req.params.id));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function summary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const raw = typeof req.query.date === 'string' ? req.query.date : undefined;
    if (!raw) {
      throw new ApiError(400, 'Date query parameter is required (format YYYY-MM-DD).');
    }
    const date = new Date(`${raw}T00:00:00`);
    if (Number.isNaN(date.getTime())) {
      throw new ApiError(400, 'Invalid date. Expected format YYYY-MM-DD.');
    }
    const data = await accountingService.summary(date);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export const accountingController = {
  createInvoice,
  listInvoices,
  getInvoice,
  createExpense,
  listExpenses,
  updateExpense,
  removeExpense,
  summary,
};