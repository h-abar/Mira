import { NextFunction, Request, Response, Router } from 'express';
import { z, ZodError } from 'zod';
import { auth, requirePermission } from '../../middleware/auth';
import { branchesController } from './branches.controller';
import {
  branchCreateSchema,
  branchListQuerySchema,
  branchUpdateSchema,
} from './branches.validation';

const branchesRouter = Router();

const branchRead = requirePermission('branches');
const branchWrite = requirePermission('branches');

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
  const parsed = branchListQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return next(new ZodError(parsed.error.issues));
  }
  res.locals.branchQuery = parsed.data;
  next();
}

branchesRouter.use(auth);

branchesRouter.get('/', branchRead, validateQuery, branchesController.listBranches);
branchesRouter.post('/', branchWrite, validate(branchCreateSchema), branchesController.createBranch);
branchesRouter.put('/:id', branchWrite, validate(branchUpdateSchema), branchesController.updateBranch);
branchesRouter.delete('/:id', branchWrite, branchesController.removeBranch);
branchesRouter.get('/:id', branchRead, branchesController.getBranch);

export default branchesRouter;