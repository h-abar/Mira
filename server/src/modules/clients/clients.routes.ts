import { NextFunction, Request, Response, Router } from 'express';
import { type ZodTypeAny } from 'zod';
import { auth, requirePermission } from '../../middleware/auth';
import { clientsController } from './clients.controller';
import { clientCreateSchema, clientSearchSchema, clientUpdateSchema } from './clients.validation';

const clientsRouter = Router();

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

clientsRouter.get(
  '/',
  auth,
  requirePermission('clients.read'),
  validateQuery(clientSearchSchema),
  clientsController.list,
);
clientsRouter.get('/:id', auth, requirePermission('clients.read'), clientsController.getById);
clientsRouter.post(
  '/',
  auth,
  requirePermission('clients.write'),
  validateBody(clientCreateSchema),
  clientsController.create,
);
clientsRouter.put(
  '/:id',
  auth,
  requirePermission('clients.write'),
  validateBody(clientUpdateSchema),
  clientsController.update,
);
clientsRouter.delete('/:id', auth, requirePermission('clients.write'), clientsController.remove);

export default clientsRouter;