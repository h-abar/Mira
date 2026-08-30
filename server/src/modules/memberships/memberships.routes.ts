import { NextFunction, Request, Response, Router } from 'express';
import { z, ZodError } from 'zod';
import { auth, requirePermission } from '../../middleware/auth';
import { membershipsController } from './memberships.controller';
import { assignSchema, planCreateSchema, planUpdateSchema } from './memberships.validation';

const router = Router();

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

router.use(auth);

// Active membership lookup is available to any authenticated user (needed by POS/appointments)
router.get('/client/:clientId', membershipsController.getClientMembership);

router.use(requirePermission('memberships'));

router.get('/plans', membershipsController.listPlans);
router.get('/plans/export', membershipsController.exportPlans);
router.post('/plans', validate(planCreateSchema), membershipsController.createPlan);
router.put('/plans/:id', validate(planUpdateSchema), membershipsController.updatePlan);
router.delete('/plans/:id', membershipsController.removePlan);

router.get('/', membershipsController.listMemberships);
router.post('/assign', validate(assignSchema), membershipsController.assign);
router.post('/:id/cancel', membershipsController.cancelMembership);

export default router;