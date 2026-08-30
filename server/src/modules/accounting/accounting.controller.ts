import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../../utils/ApiError';
import { exportDataset, fmtDate, type ExportLang } from '../../utils/exportHelper';
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
        bankReference: body.bankReference,
        bankName: body.bankName,
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

async function cancelInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseId(req.params.id);
    const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim() : undefined;
    const data = await accountingService.cancelInvoice(id, reason);
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
    const query = req.query as unknown as { from?: Date; to?: Date; category?: string; branchId?: number };
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

async function exportInvoices(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = req.query as unknown as {
      from?: Date;
      to?: Date;
      clientId?: number;
      branchId?: number;
      format?: string;
      lang?: string;
    };
    const lang: ExportLang = query.lang === 'en' ? 'en' : 'ar';
    const format = query.format === 'pdf' ? 'pdf' : 'excel';
    const data = await accountingService.listInvoices({
      from: query.from,
      to: query.to,
      clientId: query.clientId,
      branchId: query.branchId,
      limit: 1000,
    });
    const isAr = lang === 'ar';
    const dataset = {
      title: isAr ? 'الفواتير' : 'Invoices',
      subtitle: isAr
        ? `إجمالي: ${data.total} فاتورة`
        : `Total: ${data.total} invoices`,
      lang,
      columns: isAr
        ? ['#', 'التاريخ', 'العميل', 'الإجمالي (ر.س)', 'الخصم (ر.س)', 'الضريبة (ر.س)', 'الصافي (ر.س)', 'طريقة الدفع', 'الحالة']
        : ['#', 'Date', 'Client', 'Total (SAR)', 'Discount (SAR)', 'Tax (SAR)', 'Final (SAR)', 'Payment', 'Status'],
      rows: data.items.map((inv: any) => [
        inv.id,
        fmtDate(inv.date),
        inv.client?.name ?? '—',
        Number(inv.totalAmount ?? 0),
        Number(inv.discount ?? 0),
        Number(inv.tax ?? 0),
        Number(inv.finalAmount ?? 0),
        inv.paymentMethod ?? '—',
        inv.status ?? '—',
      ]),
    };
    const result = await exportDataset(dataset, format);
    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="invoices.${result.extension}"`);
    res.send(result.buffer);
  } catch (err) {
    next(err);
  }
}

async function exportExpenses(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = req.query as unknown as {
      from?: Date;
      to?: Date;
      category?: string;
      format?: string;
      lang?: string;
    };
    const lang: ExportLang = query.lang === 'en' ? 'en' : 'ar';
    const format = query.format === 'pdf' ? 'pdf' : 'excel';
    const items = await accountingService.listExpenses({
      from: query.from,
      to: query.to,
      category: query.category,
    });
    const isAr = lang === 'ar';
    const dataset = {
      title: isAr ? 'المصاريف' : 'Expenses',
      subtitle: isAr ? `إجمالي: ${items.length} مصروف` : `Total: ${items.length} expenses`,
      lang,
      columns: isAr
        ? ['#', 'التاريخ', 'الفئة', 'المبلغ (ر.س)', 'الوصف', 'بواسطة']
        : ['#', 'Date', 'Category', 'Amount (SAR)', 'Description', 'By'],
      rows: items.map((exp: any) => [
        exp.id,
        fmtDate(exp.date),
        exp.category ?? '—',
        Number(exp.amount ?? 0),
        exp.description ?? '—',
        exp.creator?.username ?? '—',
      ]),
    };
    const result = await exportDataset(dataset, format);
    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="expenses.${result.extension}"`);
    res.send(result.buffer);
  } catch (err) {
    next(err);
  }
}

export const accountingController = {
  createInvoice,
  listInvoices,
  getInvoice,
  cancelInvoice,
  createExpense,
  listExpenses,
  updateExpense,
  removeExpense,
  summary,
  exportInvoices,
  exportExpenses,
};