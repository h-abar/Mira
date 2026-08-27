import { NextFunction, Request, Response, Router } from 'express';
import { z, ZodError } from 'zod';
import { auth, requirePermission } from '../../middleware/auth';
import { inventoryController } from './inventory.controller';
import {
  idParamSchema,
  listProductsQuerySchema,
  movementCreateSchema,
  productCreateSchema,
  productUpdateSchema,
} from './inventory.validation';

const inventoryRouter = Router();

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
  const parsed = listProductsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return next(new ZodError(parsed.error.issues));
  }
  res.locals.inventoryQuery = parsed.data;
  next();
}

function validateId(req: Request, _res: Response, next: NextFunction): void {
  const parsed = idParamSchema.safeParse(req.params);
  if (!parsed.success) {
    return next(new ZodError(parsed.error.issues));
  }
  next();
}

inventoryRouter.get(
  '/products',
  auth,
  requirePermission('inventory.read'),
  validateQuery,
  inventoryController.listProducts,
);
inventoryRouter.get(
  '/products/categories',
  auth,
  requirePermission('inventory.read'),
  inventoryController.listCategories,
);
inventoryRouter.post(
  '/products/categories/rename',
  auth,
  requirePermission('inventory.write'),
  inventoryController.renameCategory,
);
inventoryRouter.post(
  '/products',
  auth,
  requirePermission('inventory.write'),
  validate(productCreateSchema),
  inventoryController.createProduct,
);
inventoryRouter.put(
  '/products/:id',
  auth,
  requirePermission('inventory.write'),
  validateId,
  validate(productUpdateSchema),
  inventoryController.updateProduct,
);
inventoryRouter.delete(
  '/products/:id',
  auth,
  requirePermission('inventory.write'),
  validateId,
  inventoryController.removeProduct,
);
inventoryRouter.get(
  '/products/:id/movements',
  auth,
  requirePermission('inventory.read'),
  validateId,
  inventoryController.listMovements,
);
inventoryRouter.get(
  '/movements',
  auth,
  requirePermission('inventory.read'),
  inventoryController.listMovements,
);
inventoryRouter.post(
  '/movements',
  auth,
  requirePermission('inventory.write'),
  validate(movementCreateSchema),
  inventoryController.addMovement,
);

export default inventoryRouter;