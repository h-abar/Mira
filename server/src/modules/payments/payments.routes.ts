import { NextFunction, Request, Response, Router } from 'express';
import { z, ZodError } from 'zod';
import { auth, requirePermission } from '../../middleware/auth';
import { paymentsController } from './payments.controller';
import {
  paymentCreateSchema,
  paymentIdParamSchema,
  paymentListQuerySchema,
} from './payments.validation';

const paymentsRouter = Router();

function validate(schema: z.ZodTypeAny) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return next(new ZodError(parsed.error.issues));
    }
    req.body = parsed.data;
    next();
  };
}

function validateQuery(req: Request, res: Response, next: NextFunction): void {
  const parsed = paymentListQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return next(new ZodError(parsed.error.issues));
  }
  res.locals.paymentQuery = parsed.data;
  next();
}

function validateId(req: Request, _res: Response, next: NextFunction): void {
  const parsed = paymentIdParamSchema.safeParse(req.params);
  if (!parsed.success) {
    return next(new ZodError(parsed.error.issues));
  }
  next();
}

paymentsRouter.use(auth);

paymentsRouter.post('/', requirePermission('payments'), validate(paymentCreateSchema), paymentsController.createPayment);
paymentsRouter.get('/', requirePermission('payments', 'accounting.read'), validateQuery, paymentsController.listPayments);
paymentsRouter.post('/:id/refund', requirePermission('payments'), validateId, paymentsController.refundPayment);

export default paymentsRouter;