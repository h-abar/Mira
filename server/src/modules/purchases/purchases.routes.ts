import { NextFunction, Request, Response, Router } from 'express';
import { z, ZodError } from 'zod';
import { auth, requirePermission } from '../../middleware/auth';
import { purchasesController } from './purchases.controller';
import { purchaseCreateSchema, purchaseListQuerySchema } from './purchases.validation';

const purchasesRouter = Router();

const purchaseRead = requirePermission('purchases');
const purchaseWrite = requirePermission('purchases');

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
  const parsed = purchaseListQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return next(new ZodError(parsed.error.issues));
  }
  res.locals.purchaseQuery = parsed.data;
  next();
}

purchasesRouter.use(auth);

purchasesRouter.get('/', purchaseRead, validateQuery, purchasesController.listPurchases);
purchasesRouter.post('/', purchaseWrite, validate(purchaseCreateSchema), purchasesController.createPurchase);
purchasesRouter.get('/:id', purchaseRead, purchasesController.getPurchase);
purchasesRouter.post('/:id/receive', purchaseWrite, purchasesController.receivePurchase);
purchasesRouter.post('/:id/cancel', purchaseWrite, purchasesController.cancelPurchase);

export default purchasesRouter;