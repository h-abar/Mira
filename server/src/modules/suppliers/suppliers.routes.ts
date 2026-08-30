import { NextFunction, Request, Response, Router } from 'express';
import { z, ZodError } from 'zod';
import { auth, requirePermission } from '../../middleware/auth';
import { suppliersController } from './suppliers.controller';
import {
  supplierCreateSchema,
  supplierListQuerySchema,
  supplierUpdateSchema,
} from './suppliers.validation';

const suppliersRouter = Router();

const supplierRead = requirePermission('suppliers');
const supplierWrite = requirePermission('suppliers');

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
  const parsed = supplierListQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return next(new ZodError(parsed.error.issues));
  }
  res.locals.supplierQuery = parsed.data;
  next();
}

suppliersRouter.use(auth);

suppliersRouter.get('/', supplierRead, validateQuery, suppliersController.listSuppliers);
suppliersRouter.post('/', supplierWrite, validate(supplierCreateSchema), suppliersController.createSupplier);
suppliersRouter.get('/export', supplierRead, suppliersController.exportSuppliers);
suppliersRouter.put('/:id', supplierWrite, validate(supplierUpdateSchema), suppliersController.updateSupplier);
suppliersRouter.delete('/:id', supplierWrite, suppliersController.removeSupplier);
suppliersRouter.get('/:id', supplierRead, suppliersController.getSupplier);

export default suppliersRouter;