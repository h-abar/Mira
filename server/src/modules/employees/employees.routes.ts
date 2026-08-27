import { NextFunction, Request, Response, Router } from 'express';
import { ZodError } from 'zod';
import { auth, requirePermission } from '../../middleware/auth';
import { employeesController } from './employees.controller';
import { employeeCreateSchema, employeeUpdateSchema } from './employees.validation';

const employeesRouter = Router();

const writeRoles = requirePermission('employees.write');
const readRoles = requirePermission('employees.read');

function validateCreate(req: Request, _res: Response, next: NextFunction): void {
  const parsed = employeeCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return next(new ZodError(parsed.error.issues));
  }
  req.body = parsed.data;
  next();
}

function validateUpdate(req: Request, _res: Response, next: NextFunction): void {
  const parsed = employeeUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return next(new ZodError(parsed.error.issues));
  }
  req.body = parsed.data;
  next();
}

employeesRouter.use(auth);

employeesRouter.get('/', readRoles, employeesController.list);
employeesRouter.get('/:id', readRoles, employeesController.getById);
employeesRouter.post('/', writeRoles, validateCreate, employeesController.create);
employeesRouter.put('/:id', writeRoles, validateUpdate, employeesController.update);
employeesRouter.delete('/:id', writeRoles, employeesController.remove);

export default employeesRouter;