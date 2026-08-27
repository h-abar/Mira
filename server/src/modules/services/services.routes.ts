import { NextFunction, Request, Response, Router } from 'express';
import { type ZodTypeAny } from 'zod';
import { auth, requirePermission } from '../../middleware/auth';
import { servicesController } from './services.controller';
import { serviceCreateSchema, serviceListSchema, serviceUpdateSchema } from './services.validation';

const servicesRouter = Router();

function validateBody(schema: ZodTypeAny) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(result.error);
      return;
    }
    req.body = result.data;
    next();
  };
}

function validateQuery(schema: ZodTypeAny) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      next(result.error);
      return;
    }
    req.query = result.data as Request['query'];
    next();
  };
}

servicesRouter.get(
  '/',
  auth,
  requirePermission('services.read'),
  validateQuery(serviceListSchema),
  servicesController.list,
);
servicesRouter.get('/categories', auth, requirePermission('services.read'), servicesController.listCategories);
servicesRouter.post(
  '/categories/rename',
  auth,
  requirePermission('services.write'),
  servicesController.renameCategory,
);
servicesRouter.get('/:id', auth, requirePermission('services.read'), servicesController.getById);
servicesRouter.post(
  '/',
  auth,
  requirePermission('services.write'),
  validateBody(serviceCreateSchema),
  servicesController.create,
);
servicesRouter.put(
  '/:id',
  auth,
  requirePermission('services.write'),
  validateBody(serviceUpdateSchema),
  servicesController.update,
);
servicesRouter.delete('/:id', auth, requirePermission('services.write'), servicesController.remove);

export default servicesRouter;