import { NextFunction, Request, Response, Router } from 'express';
import { ZodError } from 'zod';
import { auth, requirePermission } from '../../middleware/auth';
import { accountingController } from './accounting.controller';
import {
  expenseCreateSchema,
  expenseListQuerySchema,
  expenseUpdateSchema,
  invoiceCreateSchema,
  invoiceListQuerySchema,
} from './accounting.validation';

const accountingRouter = Router();

const accountRead = requirePermission('accounting.read');
const accountWrite = requirePermission('accounting.write');
const invoiceCreate = requirePermission('accounting.write', 'pos');

function validateInvoiceCreate(req: Request, _res: Response, next: NextFunction): void {
  const parsed = invoiceCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return next(new ZodError(parsed.error.issues));
  }
  req.body = parsed.data;
  next();
}

function validateInvoiceList(req: Request, _res: Response, next: NextFunction): void {
  const parsed = invoiceListQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return next(new ZodError(parsed.error.issues));
  }
  req.query = parsed.data as unknown as Request['query'];
  next();
}

function validateExpenseCreate(req: Request, _res: Response, next: NextFunction): void {
  const parsed = expenseCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return next(new ZodError(parsed.error.issues));
  }
  req.body = parsed.data;
  next();
}

function validateExpenseUpdate(req: Request, _res: Response, next: NextFunction): void {
  const parsed = expenseUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return next(new ZodError(parsed.error.issues));
  }
  req.body = parsed.data;
  next();
}

function validateExpenseList(req: Request, _res: Response, next: NextFunction): void {
  const parsed = expenseListQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return next(new ZodError(parsed.error.issues));
  }
  req.query = parsed.data as unknown as Request['query'];
  next();
}

accountingRouter.use(auth);

accountingRouter.post('/invoices', invoiceCreate, validateInvoiceCreate, accountingController.createInvoice);
accountingRouter.get('/invoices/export', accountRead, accountingController.exportInvoices);
accountingRouter.get('/invoices', accountRead, validateInvoiceList, accountingController.listInvoices);
accountingRouter.get('/invoices/:id', accountRead, accountingController.getInvoice);
accountingRouter.post('/invoices/:id/cancel', accountWrite, accountingController.cancelInvoice);

accountingRouter.post('/expenses', accountWrite, validateExpenseCreate, accountingController.createExpense);
accountingRouter.get('/expenses/export', accountRead, accountingController.exportExpenses);
accountingRouter.get('/expenses', accountRead, validateExpenseList, accountingController.listExpenses);
accountingRouter.put('/expenses/:id', accountWrite, validateExpenseUpdate, accountingController.updateExpense);
accountingRouter.delete('/expenses/:id', accountWrite, accountingController.removeExpense);

accountingRouter.get('/summary', accountRead, accountingController.summary);

export default accountingRouter;